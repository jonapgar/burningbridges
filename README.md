# burningbridges
secure chat

meet someone in real life u trust
press the "trust" button
mate the phones, and shake them together use acceleration randomness to "pair" the phones
now your phone remembers the other phone. 
when you are sent a message to your public key
you can choose to only receive messages with mated phones (they sign their message with mating signature, which you remember per friend)


one hurdle is efficiency. In order to be guaranteed to receive messages, you would need to download the entire network!
this is handled with "channels"
when phones are paired, they agree upon a starting channel (secretly derived from the mating signature)
new files are seeded on this channel, and only files on this channel are downloaded
in a message, you can tell the person what channel(s) you will send on next, and they will listen on that channel
channels keep changing. 

channel resolution (# of channels) is theoretically infinite (eg channel 1.23434235646). 
However, communicating on such a specific channel has more of a risk, so the channel resolution is controlled by the user.
higher resolution means faster but less secure communication.

the channel is marked directly on the filename, thus is public.

queries for specific channels can be syndicated across the network (like tor)
these queries can contain a high or low resolution channel. High resolution channels will find closer matches, but be less secure

eg friend steve send a message he previously said would be on channel 1.234
bill wants the message, but the network size is only 100000 torrents right now, meaning searching on chanel 1.234 reveals that he wants a message from a pool of only 10 messages
instead bill queries 1.2, he gets 1000 torrents back and downloads them all (or just the ones he wants?) even though only some of them matched the channel and only one of them was seeded initially by steve. 
But an outsider could not know that was that bill wanted