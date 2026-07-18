tag @e[type=minecraft:armor_stand,name="cb2|executor_spikes_line"] add "cb2|exec_spikes_line"
tag @e[type=minecraft:armor_stand,name="cb2|executor_spikes_center"] add "cb2|exec_spikes_center"
tag @e[type=minecraft:armor_stand,name="cb2|executor_spikes_line"] add "cb2|exec_spikes"
tag @e[type=minecraft:armor_stand,name="cb2|executor_spikes_center"] add "cb2|exec_spikes"
scoreboard players add @e[tag="cb2|exec_spikes"] "cb2|temp" 1
execute as @e[tag="cb2|exec_spikes",scores={"cb2|temp"=1..}] at @s run summon cb2:crystal_spike_executor ~~-1000~
execute as @e[tag="cb2|exec_spikes",scores={"cb2|temp"=1..}] at @s run tp @s ^^^1
kill @e[tag="cb2|exec_spikes",scores={"cb2|temp"=20..}]
