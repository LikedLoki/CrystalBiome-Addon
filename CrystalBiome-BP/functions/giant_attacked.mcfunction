scoreboard objectives add cb2attacktime dummy
scoreboard players add @e[tag=cb2is_attack] cb2attacktime 1
execute as @e[scores={cb2attacktime=20}] at @s run playsound random.explode @a ~~~ 1 0.75
execute as @e[scores={cb2attacktime=20}] at @s run particle cb2:giantattack_particle ^^1^4
execute as @e[scores={cb2attacktime=20}] at @s positioned ^^1^4 run damage @e[family=!crystal,r=5] 12 entity_attack entity @s
tag @e[scores={cb2attacktime=20..}] remove cb2is_attack
scoreboard players reset @e[scores={cb2attacktime=20..}] cb2attacktime