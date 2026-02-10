publish:
	# Navigating to root to ensure firebase.json is found and context is correct
	cd .. && firebase deploy --only hosting --project zombie-escape-online

run:
	# Opens the game locally with auto-reload (using Dockerized Firebase Emulators)
	docker-compose up -d
	@echo "Waiting for Emulators to start..."
	@sleep 5
	open http://localhost:5000
