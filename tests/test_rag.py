from app.rag.chunker import CodeChunker
from app.rag.context_builder import ContextBuilder
from app.rag.retriever import HybridRetriever


def test_code_chunker(temp_workspace):
    chunker = CodeChunker(repository_path=temp_workspace, chunk_size=30, overlap=5)
    files = chunker.get_source_files()
    assert len(files) > 0
    assert any("calculator.py" in str(f) for f in files)

    calc_file = temp_workspace / "src" / "calculator.py"
    chunks = chunker.chunk_file(calc_file)
    assert len(chunks) > 0
    assert "file" in chunks[0]
    assert "content" in chunks[0] or "raw_code" in chunks[0]


def test_vector_store_and_hybrid_retrieval(temp_workspace):
    chunker = CodeChunker(repository_path=temp_workspace)
    docs = chunker.chunk_all()
    assert len(docs) > 0

    # Test HybridRetriever
    retriever = HybridRetriever(docs)
    results = retriever.retrieve("divide zero error", top_k=3)
    assert len(results) > 0
    top_result = results[0]
    assert "calculator.py" in top_result.get("file", "")
    assert top_result.get("retrieval_score", 0) > 0


def test_context_builder(temp_workspace):
    chunker = CodeChunker(repository_path=temp_workspace)
    docs = chunker.chunk_all()
    retriever = HybridRetriever(docs)
    results = retriever.retrieve("calculator divide", top_k=2)

    builder = ContextBuilder()
    context = builder.build_context(results)
    assert "calculator.py" in context
    assert len(context) > 20
