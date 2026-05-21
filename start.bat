@echo off
echo Starting Database via Docker...
docker-compose up -d db

echo Waiting for Postgres...
timeout /t 5 /nobreak

echo Seeding Database with Mock Scenarios...
cmd /c "cd server && npm run seed"

echo Starting API Server...
start cmd /k "cd server && npm start"

echo Starting React Client...
start cmd /k "cd client && npm run dev"

echo All services started!
