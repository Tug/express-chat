NODE = node

all: app

app: dev

dev:
	@$(NODE) app.js 3000

prod:
	@(export EXPRESS_ENV=production && $(NODE) app.js 80)

