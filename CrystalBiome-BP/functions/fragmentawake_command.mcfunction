execute as @e[type=cb2:sleepking] at @s if block ~2~3~2 cb2:fragment_frame ["cb2:summon"=true] if block ~2~3~-2 cb2:boss_frame ["cb2:summon"=true] if block ~-2~3~2 cb2:boss_frame ["cb2:summon"=true] if block ~-2~3~-2  cb2:boss_frame ["cb2:summon"=true] run scoreboard players add @s spike_time 1
execute as @e[type=cb2:sleepking,scores={spike_time=1}] at @s run playanimation @s animation.sleepking.getup
execute as @e[type=cb2:sleepking,scores={spike_time=1..140}] at @s run particle cb2:kingspawn_particle ~~1~
execute as @e[type=cb2:sleepking,scores={spike_time=140}] at @s run fill ~5~5~5 ~-5~-5~-5 air replace cb2:boss_frame
execute as @e[type=cb2:sleepking,scores={spike_time=140}] at @s run playsound block.end_portal.spawn @a ~~~ 1 2
execute as @e[type=cb2:sleepking,scores={spike_time=140}] at @s run particle cb2:kingspawn2_particle ~~~
execute as @e[type=cb2:sleepking,scores={spike_time=140}] at @s run summon cb2:crystal_king ~~~
execute as @e[type=cb2:sleepking,scores={spike_time=140}] at @s run tp @s ~~-1000~
execute as @e[type=cb2:sleepking,scores={spike_time=140}] at @s run kill @s