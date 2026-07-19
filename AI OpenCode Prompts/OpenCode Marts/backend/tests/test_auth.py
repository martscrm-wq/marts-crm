import pytest


@pytest.mark.asyncio
async def test_register(client):
    resp = await client.post("/api/v1/auth/register", json={
        "email": "test@marts.ai",
        "password": "password123",
        "full_name": "Test User",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "test@marts.ai"


@pytest.mark.asyncio
async def test_register_duplicate(client):
    await client.post("/api/v1/auth/register", json={
        "email": "dup@marts.ai", "password": "password123", "full_name": "Dup",
    })
    resp = await client.post("/api/v1/auth/register", json={
        "email": "dup@marts.ai", "password": "password123", "full_name": "Dup",
    })
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login(client):
    await client.post("/api/v1/auth/register", json={
        "email": "login@marts.ai", "password": "password123", "full_name": "Login",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "login@marts.ai", "password": "password123",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/api/v1/auth/register", json={
        "email": "wrong@marts.ai", "password": "password123", "full_name": "Wrong",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "wrong@marts.ai", "password": "wrongpass",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client):
    await client.post("/api/v1/auth/register", json={
        "email": "refresh@marts.ai", "password": "password123", "full_name": "Refresh",
    })
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "refresh@marts.ai", "password": "password123",
    })
    tokens = login_resp.json()
    resp = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": tokens["refresh_token"],
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_me_endpoint(client):
    await client.post("/api/v1/auth/register", json={
        "email": "me@marts.ai", "password": "password123", "full_name": "Me",
    })
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "me@marts.ai", "password": "password123",
    })
    token = login_resp.json()["access_token"]
    resp = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@marts.ai"
