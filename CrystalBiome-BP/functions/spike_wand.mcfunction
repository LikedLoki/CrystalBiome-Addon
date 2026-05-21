scoreboard objectives add spike_time dummy
scoreboard players add @e[type=armor_stand,name=cb2spike] spike_time 1
effect @e[type=armor_stand,name=cb2spike] invisibility 1 1 true
execute as @e[type=armor_stand,name=cb2spike,scores={spike_time=1}] at @s facing entity @p feet rotated ~ 0 run tp ~~~~~
execute as @e[type=armor_stand,name=cb2spike] at @s unless block ^^-999.5^1 air unless block ^^-999.5^1 short_grass unless block ^^-999.5^1 tall_grass unless block ^^-999.5^1 fern unless block ^^-999.5^1 large_fern run tp @s ~~1~
execute as @e[type=armor_stand,name=cb2spike] at @s if block ^^-1001^ air run tp @s ~~-1~
execute as @e[type=armor_stand,name=cb2spike] at @s run tp @s ^^^-1
execute as @e[type=armor_stand,name=cb2spike] at @s run summon cb2:crystal_spike ~~-1000~
kill @e[type=armor_stand,name=cb2spike,scores={spike_time=15..}]
execute as @e[type=cb2:crystal_spike,tag=!ye] at @s run playsound break.amethyst_block @a ~~~ 0.5 0.75
tag @e[type=cb2:crystal_spike] add ye