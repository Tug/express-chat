ABFLAGS = -n 3000 -c 50
NODE = node
MONGO = /opt/mongo/bin/mongod

all: app
  
app:
	@$(NODE) app.js 3000

one: db
	@$(NODE) app.js 3000 &

two: db one
	@$(hNODE) app.js 3001 &

three: db two
	@$(NODE) app.js 3002 &

db:
	@$(MONGO) &
	sleep 5s
