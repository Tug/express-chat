
import lib.results as results
import optparse

class UserGroupConfig(object):
    def __init__(self, num_threads, name, script_file):
        self.num_threads = num_threads
        self.name = name
        self.script_file = script_file


parser = optparse.OptionParser(usage='Usage: %prog <result_dir> <runtime>')
cmd_opts, args = parser.parse_args()
output_dir = args[0]
run_time = int(args[1])
num_threads = int(args[2])
rampup = run_time
user_group_configs = [UserGroupConfig(num_threads, "group-1", "example_br.py")]
results_ts_interval = 5

results.output_results(output_dir, 'results.csv', run_time, rampup, results_ts_interval, user_group_configs)

