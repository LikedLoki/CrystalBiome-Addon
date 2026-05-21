scoreboard players add @e[type=cb2:crystalshard_proj] spike_time 1
execute as @e[scores={spike_time=1..},type=cb2:crystalshard_proj] at @s run particle cb2:crystalproj_particle ~~~
execute as @e[scores={spike_time=200..},type=cb2:crystalshard_proj] at @s run tp @s ~~~-1000~