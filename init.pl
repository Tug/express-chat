#!/usr/bin/perl

use strict;
use Cwd;

init_and_update();

exit;

sub init_and_update
{
    my $start_path = cwd();

    my %paths;
    my $updated;

    do
    {
        my $data = `find . -name '.gitmodules'`;
        chomp($data);

        $data =~ s/\/\.gitmodules//g;

        foreach my $path (split(/\n/, $data))
        {
            $paths{$path} = '' if($paths{$path} eq '');
        }

        $updated = 0;

        foreach my $path (sort keys %paths)
        {
            if($paths{$path} eq '')
            {
                chdir($path);
                `git submodule init 2>&1`;
                `git submodule update 2>&1`;
                chdir($start_path);

                if($ARGV[0] eq '--remove-gitmodules')
                {
                    unlink("$path/.gitmodules");
                }

                $paths{$path} = 1;

                $updated++;
            }
        }
    } while($updated);
}

