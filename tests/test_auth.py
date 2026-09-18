from app.core.security import create_access_token, decode_access_token, get_password_hash, verify_password


def test_password_hashing():
    raw = "MySecurePassword2026!"
    hashed = get_password_hash(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_generation_and_decoding():
    data = {"sub": "user_123", "role": "admin"}
    token = create_access_token(data)
    assert isinstance(token, str)
    assert len(token) > 20

    payload = decode_access_token(token)
    assert payload["sub"] == "user_123"
    assert payload["role"] == "admin"
    assert "exp" in payload


def test_register_and_login_flow(client):
    # 1. Register new user
    reg_res = client.post("/api/auth/register", json={
        "name": "Dev User",
        "email": "developer@codeaware.ai",
        "password": "StrongPassword999!",
        "role": "developer"
    })
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert reg_data["user"]["email"] == "developer@codeaware.ai"
    assert "access_token" in reg_data

    # 2. Duplicate registration should be rejected
    dup_res = client.post("/api/auth/register", json={
        "name": "Dev User 2",
        "email": "developer@codeaware.ai",
        "password": "StrongPassword999!",
    })
    assert dup_res.status_code == 400

    # 3. Login with correct credentials
    login_res = client.post("/api/auth/login", json={
        "email": "developer@codeaware.ai",
        "password": "StrongPassword999!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token

    # 4. Access protected /api/auth/me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["user"]["email"] == "developer@codeaware.ai"

    # 5. Bad password login
    bad_res = client.post("/api/auth/login", json={
        "email": "developer@codeaware.ai",
        "password": "IncorrectPassword"
    })
    assert bad_res.status_code == 401
