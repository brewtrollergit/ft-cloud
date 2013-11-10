# ft-cloud Protocol Design

Describes the protocol used for logging between a FermTroller or BrewTroller and the ft-cloud Logging Service.

# Overview

The purpose of this protocol is to allow an FT or BT to communicate changes to it's monitored state rapidly and concisely to an aggregation service. It is expected that this protocol be used to deliver state deltas on a periodic basis.

The protocol is simple minified JSON format data sent over UDP port 80 to the Logging Service. Minification consists of removing any whitespace that is outside of string values.

Senders can send either delta data or full updates. To save bandwidth, it is suggested that senders send full updates no more than once per minute and delta data no more than once per second. By sending a full update periodically it is ensured that the sender and receiver do not fall too far out of sync as a result of dropped packets.

# Message Format

Messages are minified JSON format. A message consists of a top level object containing several required keys and an unbounded number of update keys. There is no difference in format between a delta update and a full update. A full update just contains all available data while a delta only contains data that has changed since the last transmission.

*Note: For reasons of clarity, example messages in this document are not minified. In sofware they should be to conserve bandwidth, but are not required to be.*

## Required Keys

The following keys are required in every update message.

* **i**: *[String]* Unique ID of the sender. This is a lowercase, base 36 encoded representation of a 64 bit number. The ID is randomly generated upon setup and then saved for sending with each packet.

* **v**: *[Number]* Version of sender. This is a short number that identifies the type and version of the sender of the message. This data is used by the receiver to determine how it should interpret the message.
 
    Values currently defined for this key are:

    * **1**: FermTroller.
    * **2**: BrewTroller.
    
    While these values currently represent a specific type of hardware, in the future they may represent a specific version of a type of hardware if the receiver needs to know more about the hardware. For instance, in the future value **3** may mean *FermTroller > v3.0*.


## Example Delta FermTroller Update

Below is an example delta update from a FermTroller.

    {
        v : 1,
        i : '3w5e11264sg0g',
        z1 : {
            p : 38.2
        },
        z3 : {
            s : 30.2,
            o : 2
        }
        z4 : {
            p : 26.1,
            o : 1
        }
    }

Starting from the top, this update tells us the following:

* v = 1: It's from a FermTroller.

* k = 3w5e11264sg0g: It's unique ID in Base 36 is 3w5e11264sg0g which is 18446744073709551616 in decimal.

* z1: Contains an update for Zone 1.
    * p = 38.2: The process temperature for Zone 1 has changed to 38.2C. In this protocol, temperatures are always reported in Celsius.

* z3: Contains an update for Zone 3.
    * p = 30.2: The set temperature for Zone 3 has changed to 30.2C.
    * o = 2: The output has changed to 2, which for a FermTroller means *heating*.

* z4: Contains an update for Zone 4.
    * p = 26.1: The process temperature for Zone 4 has changed to 26.1C.
    * o = 1: The output has changed to 1, which for a FermTroller means *cooling*.
    
    
## Example Full FermTroller Update

In a full update, the only difference is that every value is sent, instead of just the ones that have changed since last time.

    {
        v : 1,
        i : '3w5e11264sg0g',
        z0 : {
            n : 'Freezer',
            p : 38.2,
            s : 37.1,
            o : 2
        },
        z2 : {
            n : 'Ferm 1',
            p : 24.1,
            s : 26.3,
            o : 2
        },
        z3 : {
            n : 'Ferm 2',
            p : 38.2,
            s : 37.1,
            o : 2
        },
        z4 : {
            n : 'Ferm 3',
            p : 38.2,
            s : 37.1,
            o : 2
        },
        z5 : {
            n : 'Ferm 4',
            p : 38.2,
            s : 37.1,
            o : 2
        },
        z6 : {
            n : 'Room',
            p : 38.2,
            s : 37.1,
            o : 2
        },
        z7 : {
            n : 'Cooler',
            p : 38.2,
            s : 37.1,
            o : 2
        }
    }

## FermTroller Specific Message Format

For a FermTroller message, aside from the required keys, the message can contain any number of zone keys. These are defined as z followed by a number, as seen in the examples above.

A zone key specifies an object that contains a zone update for one zone. The update object can contain the following keys:

* **n**: *[String]* The name of the zone.
* **p**: *[Number]* The process temperature of the zone in Celsius.
* **s**: *[Number]* The set temperature of the zone in Celsius.
* **o**: *[Number]* The output state of the zone. One of the following:
    * 0: No output.
    * 1: Cooling.
    * 2: Heating.
* **a**: Alarm status. **TBD**

## Minification

All packets should have their JSON minified before sending. This is as simple as removing any whitespace that is outside of a String value. Alternately, your packet generator can just never insert the whitespace to begin with. An example minification script can be found athttp://bigaqua.org/minify_json.html.

The above Full FermTroller Update packet would look like the following when minified.

    {v:1,i:'3w5e11264sg0g',z0:{n:'Freezer',p:38.2,s:37.1,o:2},z2:{n:'Ferm1',p:24.1,s:26.3,o:2},z3:{n:'Ferm2',p:38.2,s:37.1,o:2},z4:{n:'Ferm3',p:38.2,s:37.1,o:2},z5:{n:'Ferm4',p:38.2,s:37.1,o:2},z6:{n:'Room',p:38.2,s:37.1,o:2},z7:{n:'Cooler',p:38.2,s:37.1,o:2}}


# Wire Protocol

Minified JSON messages are sent to the service in UDP datagrams. The payload should be the minified JSON text, encoded as UTF8. No other data should be sent.

The protocol specifies UDP port 80, which is the same port used by web servers for TCP. Using port 80 decreases the likelihood of firewall disruptions in service.

It is recommended that no single packet be larger than 512 bytes. When an update would contain more than 512 bytes of data, it is recommended the update be broken into multiple packets.

Each packet must be fully realized; fragments are not allowed. So, in the case of a FermTroller that wants to send a full update for all 32 of it's zones, instead of sending one large packet it would be better to send several smaller packets containing only a few zones.

Example:

Instead of sending this large packet containing 8 zones:

    {
        v : 1,
        i : '3w5e11264sg0g',
        z0 : {
            n : 'Freezer',
            p : 38.2,
            s : 37.1,
            o : 2
        },
        z1 : {
            n : 'Ferm 1',
            p : 24.1,
            s : 26.3,
            o : 2
        },
        z2 : {
            n : 'Ferm 1',
            p : 24.1,
            s : 26.3,
            o : 2
        },
        z3 : {
            n : 'Ferm 2',
            p : 38.2,
            s : 37.1,
            o : 2
        },
        z4 : {
            n : 'Ferm 3',
            p : 38.2,
            s : 37.1,
            o : 2
        },
        z5 : {
            n : 'Ferm 4',
            p : 38.2,
            s : 37.1,
            o : 2
        },
        z6 : {
            n : 'Room',
            p : 38.2,
            s : 37.1,
            o : 2
        },
        z7 : {
            n : 'Cooler',
            p : 38.2,
            s : 37.1,
            o : 2
        }
    }

Instead send two packets containing only 4 zones each.

First packet:

    {
        v : 1,
        i : '3w5e11264sg0g',
        z0 : {
            n : 'Freezer',
            p : 38.2,
            s : 37.1,
            o : 2
        },
        z1 : {
            n : 'Ferm 1',
            p : 24.1,
            s : 26.3,
            o : 2
        },
        z2 : {
            n : 'Ferm 1',
            p : 24.1,
            s : 26.3,
            o : 2
        },
        z3 : {
            n : 'Ferm 2',
            p : 38.2,
            s : 37.1,
            o : 2
        }
    }
    
Second packet:

    {
        v : 1,
        i : '3w5e11264sg0g',
        z4 : {
            n : 'Ferm 3',
            p : 38.2,
            s : 37.1,
            o : 2
        },
        z5 : {
            n : 'Ferm 4',
            p : 38.2,
            s : 37.1,
            o : 2
        },
        z6 : {
            n : 'Room',
            p : 38.2,
            s : 37.1,
            o : 2
        },
        z7 : {
            n : 'Cooler',
            p : 38.2,
            s : 37.1,
            o : 2
        }
    }
