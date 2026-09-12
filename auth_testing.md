# ReLoop Auth Testing Playbook

## Step 1: MongoDB Verification
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```
Verify bcrypt hash starts with `$2b$`, unique index exists on users.email.

## Step 2: API Testing (JWT via httpOnly cookies + Bearer fallback)
```
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@reloop.io","password":"Admin@123"}'
cat cookies.txt
curl -b cookies.txt http://localhost:8001/api/auth/me
```
Login returns user object + sets access_token/refresh_token cookies. /me returns same user.

## Demo Accounts
- Admin: admin@reloop.io / Admin@123
- Staff: staff@reloop.io / Staff@123
- Student: arjun@campus.edu / Student@123
