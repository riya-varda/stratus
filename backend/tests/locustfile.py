from locust import HttpUser, task, between
import random
import string


def random_string(n=8):
    return "".join(random.choices(string.ascii_lowercase, k=n))


class StratusUser(HttpUser):
    wait_time = between(1, 3)
    token = None

    def on_start(self):
        username = random_string()
        email = f"{username}@loadtest.com"
        self.client.post("/api/v1/auth/register", json={
            "email": email,
            "username": username,
            "password": "LoadTest1",
        })
        response = self.client.post("/api/v1/auth/login", json={
            "email": email,
            "password": "LoadTest1",
        })
        if response.status_code == 200:
            self.token = response.json().get("access_token")

    def get_headers(self):
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(3)
    def list_projects(self):
        self.client.get("/api/v1/projects/", headers=self.get_headers())

    @task(1)
    def create_project(self):
        self.client.post(
            "/api/v1/projects/",
            json={"name": f"Project {random_string()}", "description": "Load test project"},
            headers=self.get_headers(),
        )

    @task(2)
    def health_check(self):
        self.client.get("/api/v1/health")

    @task(1)
    def get_me(self):
        self.client.get("/api/v1/users/me", headers=self.get_headers())
