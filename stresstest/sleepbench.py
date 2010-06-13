from datetime import datetime
import time

num_thread = 50000
t = 300
interval = float(t)/num_thread
print interval
start = datetime.now()
[time.sleep(interval) for i in xrange(num_thread)]
end = datetime.now()
delta = end-start
deltasec = delta.seconds + delta.microseconds/1000000.
print "wanted time %f" %t
print "real time %f" % deltasec
