scoreboard objectives add cb2attacktime dummy
scoreboard players add @e[tag=cb2gc_is_attack,type=cb2:giant_cluster] cb2attacktime 1
execute as @e[tag=cb2gc_is_attack,scores={cb2attacktime=20},type=cb2:giant_cluster] at @s run scriptevent cb2:giant_cluster_attack
tag @e[tag=cb2gc_is_attack,scores={cb2attacktime=20..},type=cb2:giant_cluster] remove cb2gc_is_attack
scoreboard players reset @e[scores={cb2attacktime=20..},type=cb2:giant_cluster] cb2attacktime

scoreboard players add @e[tag=cb2gs_is_attack,type=cb2:giant_strata] cb2attacktime 1
execute as @e[tag=cb2gs_is_attack,scores={cb2attacktime=20},type=cb2:giant_strata] at @s run scriptevent cb2:giant_strata_attack
tag @e[tag=cb2gs_is_attack,scores={cb2attacktime=20..},type=cb2:giant_strata] remove cb2gs_is_attack
scoreboard players reset @e[scores={cb2attacktime=20..},type=cb2:giant_strata] cb2attacktime