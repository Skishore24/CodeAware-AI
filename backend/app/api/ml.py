import json
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field

from app.core.logging import get_logger
from app.ml.datasets.cvefixes_loader import CVEFixesLoader
from app.ml.inference.vulnerability_detector import VulnerabilityDetector
from app.ml.training.vulnerability_trainer import VulnerabilityModelTrainer

logger = get_logger("app.api.ml")

router = APIRouter(
    prefix="/ml",
    tags=["Machine Learning & Models Registry"],
)

# Training status state tracker
_training_state = {
    "is_training": False,
    "progress": 0,
    "status": "idle",
    "dataset": None,
    "start_time": None,
    "last_result": None,
    "error": None,
}
_state_lock = threading.Lock()


class TrainModelRequest(BaseModel):
    dataset: str = Field(default="cvefixes", description="Dataset identifier: 'cvefixes' or 'codesearchnet'")
    max_samples: Optional[int] = Field(default=None, description="Max samples to train on (None for all)")
    test_size: float = Field(default=0.2, ge=0.05, le=0.5, description="Test split proportion")
    max_features: int = Field(default=25000, ge=1000, le=100000, description="TF-IDF max vocabulary features")
    regularization_c: float = Field(default=1.5, gt=0.0, description="Logistic regression C parameter")
    languages: Optional[List[str]] = Field(default=None, description="Optional language filter, e.g. ['python', 'js']")
    run_async: bool = Field(default=False, description="Run in background thread")


class PredictRequest(BaseModel):
    code: str = Field(..., description="Source code snippet to evaluate")
    language: Optional[str] = Field(default=None, description="Language hint, e.g. python, java, c, javascript")


@router.get("/datasets")
def list_datasets() -> Dict[str, Any]:
    """
    Scans the workspace dataset directory and returns metadata on imported datasets.
    """
    dataset_dir = Path(__file__).resolve().parents[3] / "dataset"
    datasets_info = []

    # 1. CVEFixes
    cve_loader = CVEFixesLoader()
    if cve_loader.exists():
        summary = cve_loader.get_summary()
        datasets_info.append({
            "id": "cvefixes",
            "name": "CVEFixes Vulnerability & Security Fixes",
            "description": "31,194 curated code snippets from real CVE vulnerability commits across 48 programming languages.",
            "category": "security_vulnerability",
            "format": "csv",
            "size_mb": summary.get("size_mb", 0),
            "samples": summary.get("total_samples", 0),
            "labels": summary.get("labels", {}),
            "languages": summary.get("top_languages", {}),
            "status": "ready_to_train",
            "recommended_model": "Code Vulnerability & Safety Classifier",
        })
    else:
        datasets_info.append({
            "id": "cvefixes",
            "name": "CVEFixes Vulnerability Dataset",
            "status": "not_found",
            "path": str(cve_loader.csv_path),
        })

    # 2. CodeSearchNet
    csn_dir = dataset_dir / "codesearchnet"
    if csn_dir.exists():
        languages_found = []
        total_size_mb = 0.0
        for sub in csn_dir.iterdir():
            if sub.is_dir():
                sub_size = sum(f.stat().st_size for f in sub.glob("**/*") if f.is_file())
                total_size_mb += sub_size / (1024 * 1024)
                languages_found.append(sub.name)

        datasets_info.append({
            "id": "codesearchnet",
            "name": "CodeSearchNet Multi-Language Corpus",
            "description": "Over 1.15M functions with docstrings, tokens, and AST identifiers for code search and semantic retrieval.",
            "category": "code_search_retrieval",
            "format": "pickle / dedupe",
            "size_mb": round(total_size_mb, 2),
            "samples": "1.15M+ functions",
            "languages": languages_found,
            "status": "ready_to_train",
            "recommended_model": "Code Semantic Search & Intent Ranker",
        })

    return {
        "success": True,
        "count": len(datasets_info),
        "datasets": datasets_info,
    }


def _execute_training_job(req: TrainModelRequest):
    global _training_state
    with _state_lock:
        _training_state["is_training"] = True
        _training_state["progress"] = 10
        _training_state["status"] = "Loading and preprocessing dataset..."
        _training_state["dataset"] = req.dataset
        _training_state["start_time"] = time.time()
        _training_state["error"] = None

    try:
        trainer = VulnerabilityModelTrainer()
        with _state_lock:
            _training_state["progress"] = 35
            _training_state["status"] = "Extracting TF-IDF features and token matrices..."

        meta = trainer.train(
            max_samples=req.max_samples,
            test_size=req.test_size,
            max_features=req.max_features,
            regularization_c=req.regularization_c,
            languages=req.languages,
        )

        # Reload singleton detector so live inference uses new model immediately
        detector = VulnerabilityDetector()
        detector.load_model()

        with _state_lock:
            _training_state["is_training"] = False
            _training_state["progress"] = 100
            _training_state["status"] = "Completed successfully"
            _training_state["last_result"] = meta
    except Exception as exc:
        logger.error(f"Training job failed: {exc}", exc_info=True)
        with _state_lock:
            _training_state["is_training"] = False
            _training_state["status"] = "Failed"
            _training_state["error"] = str(exc)


@router.post("/train")
def train_model(req: TrainModelRequest, background_tasks: BackgroundTasks) -> Dict[str, Any]:
    """
    Trains a model on the requested dataset.
    Can be run synchronously or asynchronously with status polling.
    """
    with _state_lock:
        if _training_state["is_training"]:
            raise HTTPException(status_code=409, detail="A training job is already in progress.")

    if req.dataset != "cvefixes":
        raise HTTPException(
            status_code=400,
            detail=f"Automated training is currently supported on 'cvefixes'. '{req.dataset}' is being prepared.",
        )

    if req.run_async:
        background_tasks.add_task(_execute_training_job, req)
        return {
            "success": True,
            "message": "Training job initiated in background.",
            "status": "training_started",
            "dataset": req.dataset,
        }
    else:
        # Run synchronously
        _execute_training_job(req)
        with _state_lock:
            if _training_state["error"]:
                raise HTTPException(status_code=500, detail=_training_state["error"])
            return {
                "success": True,
                "message": "Model training completed successfully.",
                "model": _training_state["last_result"],
            }


@router.get("/train/status")
def get_training_status() -> Dict[str, Any]:
    """
    Returns current training job status, progress, and latest result.
    """
    with _state_lock:
        elapsed = None
        if _training_state["start_time"]:
            elapsed = round(time.time() - _training_state["start_time"], 1)
        return {
            "success": True,
            "is_training": _training_state["is_training"],
            "progress": _training_state["progress"],
            "status": _training_state["status"],
            "dataset": _training_state["dataset"],
            "elapsed_seconds": elapsed,
            "last_result": _training_state["last_result"],
            "error": _training_state["error"],
        }


@router.get("/models")
def list_models() -> Dict[str, Any]:
    """
    Returns all trained models in the registry along with performance metrics.
    """
    models_dir = Path(__file__).resolve().parent.parent / "ml" / "models"
    models = []

    detector = VulnerabilityDetector()
    is_active = detector.is_available()

    if models_dir.exists():
        for meta_file in models_dir.glob("*_meta.json"):
            try:
                with open(meta_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    data["active"] = is_active
                    models.append(data)
            except Exception as e:
                logger.warning(f"Could not read metadata {meta_file}: {e}")

    return {
        "success": True,
        "count": len(models),
        "models": models,
    }


@router.post("/predict")
def predict_code(request: PredictRequest) -> Dict[str, Any]:
    """
    Evaluates source code with the trained ML Vulnerability Detector.
    Returns vulnerability probability, classification, risk level, and suspicious tokens.
    """
    try:
        detector = VulnerabilityDetector()
        res = detector.predict(request.code, language=request.language)
        return {
            "success": True,
            **res,
        }
    except Exception as exc:
        logger.error(f"Inference prediction error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/models/{model_id}/activate")
def activate_model(model_id: str) -> Dict[str, Any]:
    """
    Activates and hot-reloads a model into the live inference engine.
    """
    detector = VulnerabilityDetector()
    ok = detector.load_model()
    if not ok:
        raise HTTPException(status_code=404, detail="Model artifact could not be loaded.")
    return {
        "success": True,
        "message": f"Model '{model_id}' successfully activated for live inference and security scans.",
        "metadata": detector.get_metadata(),
    }
