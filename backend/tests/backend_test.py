"""ReLoop backend API tests."""
import os
import uuid
import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") + "/api"


def _login(email, password):
    r = requests.post(f"{BASE}/auth/login", json={"email": email, "password": password}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def admin_token():
    return _login("admin@reloop.io", "Admin@123")


@pytest.fixture(scope="module")
def staff_token():
    return _login("staff@reloop.io", "Staff@123")


@pytest.fixture(scope="module")
def student_token():
    return _login("arjun@campus.edu", "Student@123")


def h(t):
    return {"Authorization": f"Bearer {t}"}


# ---------------- Auth ----------------
class TestAuth:
    def test_login_admin(self, admin_token):
        assert isinstance(admin_token, str) and len(admin_token) > 20

    def test_login_staff(self, staff_token):
        assert staff_token

    def test_login_student(self, student_token):
        assert student_token

    def test_me(self, student_token):
        r = requests.get(f"{BASE}/auth/me", headers=h(student_token))
        assert r.status_code == 200
        assert r.json()["email"] == "arjun@campus.edu"
        assert r.json()["role"] == "student"

    def test_bad_login(self):
        r = requests.post(f"{BASE}/auth/login", json={"email": "admin@reloop.io", "password": "wrong"})
        assert r.status_code == 401

    def test_register_new_student(self):
        email = f"test_{uuid.uuid4().hex[:8]}@campus.edu"
        r = requests.post(f"{BASE}/auth/register", json={
            "name": "TEST User", "email": email, "password": "Test@1234"
        })
        assert r.status_code == 200, r.text
        j = r.json()
        assert "access_token" in j and j["user"]["email"] == email
        assert j["user"]["role"] == "student"


# ---------------- RBAC ----------------
class TestRBAC:
    def test_student_cannot_list_containers(self, student_token):
        r = requests.get(f"{BASE}/containers", headers=h(student_token))
        assert r.status_code == 403

    def test_student_cannot_list_students(self, student_token):
        r = requests.get(f"{BASE}/students", headers=h(student_token))
        assert r.status_code == 403

    def test_student_cannot_view_analytics(self, student_token):
        r = requests.get(f"{BASE}/analytics/dashboard", headers=h(student_token))
        assert r.status_code == 403

    def test_admin_can_list_containers(self, admin_token):
        r = requests.get(f"{BASE}/containers", headers=h(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_staff_can_list_students(self, staff_token):
        r = requests.get(f"{BASE}/students", headers=h(staff_token))
        assert r.status_code == 200


# ---------------- Kiosk full flow ----------------
class TestKioskFlow:
    def test_full_return_flow(self, admin_token, staff_token):
        # find an Available container
        containers = requests.get(f"{BASE}/containers", headers=h(admin_token)).json()
        available = [c for c in containers if c["status"] == "Available"]
        assert available, "Need at least one available container"
        container = available[0]

        # pick a student
        students = requests.get(f"{BASE}/students", headers=h(admin_token)).json()
        student = next(s for s in students if s["email"] == "priya@campus.edu")
        bal_before = student["wallet_balance"]

        # issue
        r = requests.post(f"{BASE}/containers/issue", headers=h(staff_token), json={
            "student_id": student["id"], "container_id": container["id"]
        })
        assert r.status_code == 200, r.text
        txn = r.json()
        assert txn["status"] == "Issued"
        deposit = txn["deposit_amount"]

        # verify container status changed
        c2 = requests.get(f"{BASE}/containers", headers=h(admin_token)).json()
        c2 = next(c for c in c2 if c["id"] == container["id"])
        assert c2["status"] == "Issued"

        # wallet debited
        me = requests.get(f"{BASE}/auth/me", headers=h(_login("priya@campus.edu", "Student@123")))
        assert me.status_code == 200
        assert round(me.json()["wallet_balance"], 2) == round(bal_before - deposit, 2)

        # kiosk available returns should include this
        avail = requests.get(f"{BASE}/kiosk/available-returns").json()
        assert any(a["rfid_uid"] == container["rfid_uid"] for a in avail)

        # rfid scan
        r = requests.post(f"{BASE}/rfid/scan", json={"rfid_uid": container["rfid_uid"]})
        assert r.status_code == 200
        expected_weight = r.json()["expected_weight"]

        # weight verify: FAIL first (way outside tolerance)
        r_fail = requests.post(f"{BASE}/weight/verify", json={
            "container_id": container["id"], "measured_weight": expected_weight + 500
        })
        assert r_fail.status_code == 200
        assert r_fail.json()["verified"] is False
        # ensure state unchanged
        c3 = next(c for c in requests.get(f"{BASE}/containers", headers=h(admin_token)).json() if c["id"] == container["id"])
        assert c3["status"] == "Issued"

        # weight verify: SUCCESS (empty)
        r_ok = requests.post(f"{BASE}/weight/verify", json={
            "container_id": container["id"], "measured_weight": expected_weight
        })
        assert r_ok.status_code == 200, r_ok.text
        body = r_ok.json()
        assert body["verified"] is True
        assert body["refund_amount"] == deposit
        assert round(body["new_balance"], 2) == round(bal_before, 2)

        # container -> Washing
        c4 = next(c for c in requests.get(f"{BASE}/containers", headers=h(admin_token)).json() if c["id"] == container["id"])
        assert c4["status"] == "Washing"

        # duplicate scan should fail
        r_dup = requests.post(f"{BASE}/rfid/scan", json={"rfid_uid": container["rfid_uid"]})
        assert r_dup.status_code == 400

        # cleaning workflow
        pending = requests.get(f"{BASE}/cleaning/pending", headers=h(staff_token)).json()
        assert any(p["id"] == container["id"] for p in pending)
        r = requests.post(f"{BASE}/cleaning/{container['id']}/complete", headers=h(staff_token))
        assert r.status_code == 200
        c5 = next(c for c in requests.get(f"{BASE}/containers", headers=h(admin_token)).json() if c["id"] == container["id"])
        assert c5["status"] == "Ready"
        r = requests.post(f"{BASE}/containers/{container['id']}/mark-available", headers=h(staff_token))
        assert r.status_code == 200
        c6 = next(c for c in requests.get(f"{BASE}/containers", headers=h(admin_token)).json() if c["id"] == container["id"])
        assert c6["status"] == "Available"


# ---------------- Analytics ----------------
class TestAnalytics:
    def test_dashboard(self, admin_token):
        r = requests.get(f"{BASE}/analytics/dashboard", headers=h(admin_token))
        assert r.status_code == 200
        j = r.json()
        for k in ("total_containers", "return_rate", "waste_kg", "co2_kg", "cost_saved",
                  "status_distribution", "daily_activity", "top_reused"):
            assert k in j
        assert j["total_containers"] >= 12
        assert isinstance(j["status_distribution"], list)


# ---------------- Settings ----------------
class TestSettings:
    def test_admin_get(self, admin_token):
        r = requests.get(f"{BASE}/settings", headers=h(admin_token))
        assert r.status_code == 200
        for k in ("deposit_amount", "weight_tolerance", "disposable_cost"):
            assert k in r.json()

    def test_staff_get(self, staff_token):
        assert requests.get(f"{BASE}/settings", headers=h(staff_token)).status_code == 200

    def test_staff_cannot_put(self, staff_token):
        r = requests.put(f"{BASE}/settings", headers=h(staff_token),
                         json={"deposit_amount": 30, "weight_tolerance": 15, "disposable_cost": 6})
        assert r.status_code == 403

    def test_admin_put(self, admin_token):
        r = requests.put(f"{BASE}/settings", headers=h(admin_token),
                         json={"deposit_amount": 30, "weight_tolerance": 15, "disposable_cost": 6})
        assert r.status_code == 200
        assert r.json()["deposit_amount"] == 30


# ---------------- Student endpoints ----------------
class TestStudentSelf:
    def test_summary(self, student_token):
        r = requests.get(f"{BASE}/students/me/summary", headers=h(student_token))
        assert r.status_code == 200
        j = r.json()
        for k in ("reuse_cycles", "active_containers", "wallet_balance", "waste_avoided_g", "co2_avoided_g"):
            assert k in j

    def test_container(self, student_token):
        r = requests.get(f"{BASE}/students/me/container", headers=h(student_token))
        assert r.status_code == 200

    def test_transactions(self, student_token):
        r = requests.get(f"{BASE}/students/me/transactions", headers=h(student_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_returns(self, student_token):
        r = requests.get(f"{BASE}/students/me/returns", headers=h(student_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)



# ---------------- Kiosk student tap ----------------
class TestKioskStudentTap:
    def test_kiosk_students_public(self):
        r = requests.get(f"{BASE}/kiosk/students")
        assert r.status_code == 200
        lst = r.json()
        assert isinstance(lst, list) and len(lst) >= 1
        s0 = lst[0]
        for k in ("id", "name", "student_code"):
            assert k in s0

    def test_kiosk_student_returns_only_issued(self, admin_token):
        # find a student who has an Issued txn
        txns = requests.get(f"{BASE}/transactions", headers=h(admin_token)).json()
        issued = [t for t in txns if t["status"] == "Issued"]
        assert issued, "Need at least one issued container for this test"
        sid = issued[0]["student_id"]
        r = requests.get(f"{BASE}/kiosk/student-returns/{sid}")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) >= 1
        for it in items:
            for k in ("rfid_uid", "container_code", "empty_weight", "student_name", "deposit_amount"):
                assert k in it


# ---------------- Wallet top-up ----------------
class TestWalletTopup:
    def test_topup_success(self):
        token = _login("priya@campus.edu", "Student@123")
        me1 = requests.get(f"{BASE}/auth/me", headers=h(token)).json()
        before = me1["wallet_balance"]
        r = requests.post(f"{BASE}/wallet/topup", headers=h(token), json={"amount": 100})
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["amount"] == 100
        assert round(j["new_balance"], 2) == round(before + 100, 2)
        # verify txn row
        txns = requests.get(f"{BASE}/students/me/transactions", headers=h(token)).json()
        assert any(t["transaction_type"] == "Topup" and t["amount"] == 100 for t in txns)

    def test_topup_reject_zero(self, student_token):
        r = requests.post(f"{BASE}/wallet/topup", headers=h(student_token), json={"amount": 0})
        assert r.status_code == 400

    def test_topup_reject_too_large(self, student_token):
        r = requests.post(f"{BASE}/wallet/topup", headers=h(student_token), json={"amount": 20000})
        assert r.status_code == 400

    def test_topup_reject_non_student(self, admin_token):
        r = requests.post(f"{BASE}/wallet/topup", headers=h(admin_token), json={"amount": 100})
        assert r.status_code == 403


# ---------------- ESG report ----------------
class TestESGReport:
    def test_admin_report(self, admin_token):
        r = requests.get(f"{BASE}/analytics/report", headers=h(admin_token))
        assert r.status_code == 200
        j = r.json()
        for k in ("generated_at", "rows", "totals"):
            assert k in j
        assert isinstance(j["rows"], list) and len(j["rows"]) >= 1
        row = j["rows"][0]
        for k in ("month", "issued", "returned", "return_rate", "disposables_avoided",
                  "waste_kg", "co2_kg", "cost_saved"):
            assert k in row
        for k in ("issued", "returned", "disposables_avoided", "waste_kg", "co2_kg", "cost_saved"):
            assert k in j["totals"]

    def test_student_cannot_report(self, student_token):
        r = requests.get(f"{BASE}/analytics/report", headers=h(student_token))
        assert r.status_code == 403


# ---------------- Overdue / lost alerts ----------------
class TestAlerts:
    def test_overdue_lists_seeded(self, admin_token):
        r = requests.get(f"{BASE}/alerts/overdue", headers=h(admin_token))
        assert r.status_code == 200
        j = r.json()
        assert "threshold_hours" in j and "overdue" in j
        assert isinstance(j["overdue"], list)
        assert len(j["overdue"]) >= 1, "Expected the seeded ~96h overdue container"
        item = j["overdue"][0]
        for k in ("id", "student_id", "student_name", "container_code", "hours_overdue", "reminded"):
            assert k in item

    def test_student_cannot_view_overdue(self, student_token):
        r = requests.get(f"{BASE}/alerts/overdue", headers=h(student_token))
        assert r.status_code == 403

    def test_remind_creates_notification(self, admin_token):
        overdue = requests.get(f"{BASE}/alerts/overdue", headers=h(admin_token)).json()["overdue"]
        assert overdue
        txn = overdue[0]
        r = requests.post(f"{BASE}/alerts/remind", headers=h(admin_token), json={"transaction_id": txn["id"]})
        assert r.status_code == 200
        assert r.json()["student_name"] == txn["student_name"]

        # student sees a notification (login as the student whose email we know matches student_id)
        # We can't reverse email → use any student token that has a notification. Try arjun.
        stok = _login("arjun@campus.edu", "Student@123")
        arjun = requests.get(f"{BASE}/auth/me", headers=h(stok)).json()
        if arjun["id"] == txn["student_id"]:
            notes = requests.get(f"{BASE}/students/me/notifications", headers=h(stok)).json()
            assert any(n["reference"] == txn["id"] for n in notes)

    def test_mark_read(self, admin_token):
        stok = _login("arjun@campus.edu", "Student@123")
        notes = requests.get(f"{BASE}/students/me/notifications", headers=h(stok)).json()
        if not notes:
            pytest.skip("no notifications for arjun")
        nid = notes[0]["id"]
        r = requests.post(f"{BASE}/notifications/{nid}/read", headers=h(stok))
        assert r.status_code == 200
        notes2 = requests.get(f"{BASE}/students/me/notifications", headers=h(stok)).json()
        target = next(n for n in notes2 if n["id"] == nid)
        assert target["read"] is True

    def test_mark_lost_flow(self, admin_token):
        # Pick an available container, issue it to a student, then mark-lost
        containers = requests.get(f"{BASE}/containers", headers=h(admin_token)).json()
        available = [c for c in containers if c["status"] == "Available"]
        if not available:
            pytest.skip("no available container")
        cont = available[0]
        students = requests.get(f"{BASE}/students", headers=h(admin_token)).json()
        stu = next(s for s in students if s["email"] == "karan@campus.edu")
        issue = requests.post(f"{BASE}/containers/issue", headers=h(admin_token),
                              json={"student_id": stu["id"], "container_id": cont["id"]})
        assert issue.status_code == 200
        txn_id = issue.json()["id"]
        r = requests.post(f"{BASE}/containers/{cont['id']}/mark-lost", headers=h(admin_token))
        assert r.status_code == 200
        # container now Lost
        c2 = next(c for c in requests.get(f"{BASE}/containers", headers=h(admin_token)).json() if c["id"] == cont["id"])
        assert c2["status"] == "Lost"
        # txn no longer Issued
        txns = requests.get(f"{BASE}/transactions", headers=h(admin_token)).json()
        t = next(t for t in txns if t["id"] == txn_id)
        assert t["status"] == "Lost"
