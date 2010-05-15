ABFLAGS = -n 3000 -c 50
NODE = node

all: app

app:
	@$(NODE) app.js 3000

one:
	@$(NODE) app.js 3000 &

two: one
	@$(NODE) app.js 3001 &

three: two
	@$(NODE) app.js 3002 &

