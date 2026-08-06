scoreboard objectives add cb2attacktime dummy
scoreboard players add @e[tag=cb2gc_is_attack,type=cb2:giant_cluster] cb2attacktime 1
execute as @e[scores={cb2attacktime=20},type=cb2:giant_cluster] at @s run playsound random.explode @a ~~~ 1 0.75
execute as @e[scores={cb2attacktime=20},type=cb2:giant_cluster] at @s run scriptevent cb2:giant_cluster_attack
execute as @e[scores={cb2attacktime=20},type=cb2:giant_cluster] at @s positioned ^^1^4 run damage @e[family=!crystal,r=5] 12 entity_attack entity @s
tag @e[scores={cb2attacktime=20..},type=cb2:giant_cluster] remove cb2gc_is_attack
scoreboard players reset @e[scores={cb2attacktime=20..},type=cb2:giant_cluster] cb2attacktime

scoreboard players add @e[tag=cb2gs_is_attack,type=cb2:giant_strata] cb2attacktime 1
execute as @e[tag=cb2gs_is_attack,scores={cb2attacktime=20},type=cb2:giant_strata] at @s run playsound random.explode @a ~~~ 1 0.75
execute as @e[scores={cb2attacktime=20},type=cb2:giant_strata] at @s run scriptevent cb2:giant_strata_attack
execute as @e[tag=cb2gs_is_attack,scores={cb2attacktime=20},type=cb2:giant_strata] at @s positioned ^^1^4 run damage @e[family=!crystal,r=5] 12 entity_attack entity @s
tag @e[tag=cb2gs_is_attack,scores={cb2attacktime=20..},type=cb2:giant_strata] remove cb2gs_is_attack
scoreboard players reset @e[scores={cb2attacktime=20..},type=cb2:giant_strata] cb2attacktime