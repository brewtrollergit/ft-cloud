# ft-cloud Project Outline

The project has four components: Logging Service, BTNIC Changes, FT Changes, Web Interface.

# Logging Service

The Logging Service is a lightweight Node.js application designed to run on the public Internet. It has the following major features:
    
1. A UDP listener that receives logging events from FTs around the world. Packet structure is documented below.
2. Logging of events to a database of some type. Current thinking is CouchBase or MongoDB.
3. A number of RESTful HTTP web service routes that allow consumers of the API to get data for one or more FTs.
4. Basic authentication services so that consumers can only access their own data. This is probably in the form of a simple text key. More thoughts on this later.
5. Designed to run on commodity hardware. Cheap web hosting, EC2, co-located servers, etc. It will be designed to scale horizontally if needed.

The purpose of the Logging Service is to provide a destination for FT to log to. By running this as a service users get the benefit of it being "always on" and not having to deal with firewall issues. In addition, users can access it from anywhere.

## UDP

FT will send log data to the Logging Service using UDP. UDP is connectionless and extremely low overhead. Since it's connectionless the FT does need to maintain a constant connection to the Logging Service. It can just send messages off at a chosen frequency.

UDP is also not guaranteed, which is ideal for logging. We don't mind if we drop a few messages here and there, as long as we receive an overall picture of the state of the FT.

Logging data will be sent to the Logging Service in a compact delta binary format. During each update the FT will only send values that changed from the last update and values will be sent in as compact a form as possible. The FT will also send a full update, including all values, periodically to make sure that all values stay in sync.

The purpose of this is to keep bandwidth low and to increase the likelihood of message delivery.

## Authentication

Authentication needs to happen on two fronts.

1. The FT's identity needs to be verified with every message so that attackers can not send messages pretending to be another FT.
2. The API consumer's identity needs to be verified so that attackers can not view data from FTs that they do not own.

Now, since we're not exactly dealing with life or death here, I think we can take a frugal approach to the security.

When the user enables CloudTroller on an FT the FT will generate a 64 bit random number and store it for future use. This number becomes the key that FT sends with every UDP packet and it identifies a BT uniquely in the world. 64 bits offers a total of 18446744073709551616 possible keys - more than enough for this application.

The key is shown to the user in the FT user interface encoded in Base 36. So, for instance, the key 18446744073709551616 would be shown to the user as "3W5E11264SG0G". The user can generate a new key at any time.

On the API side, the same key is used to fetch data from the service.

## API Routes

The web API is a RESTful service, meaning that you can consume the API using simple HTTP commands. Payloads, where needed, will be in JSON format.

A rough outline of what the web API might provide:

* Download logging data for a given FT for a given date range and frequency. For instance, you can request logging data for the hour of 2013-11-07 11:00:00 to 2013-11-07 12:00:00 with a 1 minute frequency. This would return 60 records containing the full state of the FT as the API understands it for that time frame. This route would be used for graphing and history.
* Open a flowing connection, where updates will be sent via HTTP keep-alive as they come in from the FT. This route would be used for showing a live interface, such as a control panel.

# BTNIC Changes

Changes will need to be made to the BTNIC firmware to send binary delta log data over UDP to the CloudTroller service.

The changes will consist of:

* Enable or disable the service from the control interface. I believe this is I2C from the FT or BT.
* Set the hostname for the service. This will generally be hidden from the user, but available for debugging and development.
* Set the UDP key, as described above.
* Set the frequency of updates, in seconds.

The BTNIC firmware will be responsible for querying the FT or BT on the specified frequency and sending a binary delta packet off to the Logging Service. Alternately, the FT or BT could initiate each send if that makes more sense from a software perspective.

# FermTroller Changes

The changes to FermTroller should be very minimal.

* User interface to allow the user to turn on and off CloudTroller, generate a new key and set the update frequency in seconds.
* Neccessary changes to command the BTNIC to do the things described in the BTNIC Changes section.


# Web Interface

The Web Interface will be the public facing component of CloudTroller. Depending on how in depth you want this to be, it can either be a seperate project or just be an additional part of the Logging Service. In either case, it would be Node.js and designed with the same goals as the Logging Service regarding deployment and scalability.

It would have the following basic features:

* A simple username and password authentication system. This would be purely used to group users' data. It would include the ability to create a new account, save basic profile data and change your password. Alternately, this could use the same authentication you use for your existing sites.
* The ability to add and remove FTs to your account, using their unique key.
* A dashboard showing the current state of the user's registered FTs, in real time.
* A graph showing set points, output status and temperature, or other stats of your choosing, per FT. The user can choose to have the graph update live or choose a date range and frequency to see historic data.
* The graph area will also have a button that allows the user to download the logs that make up the data for that particular graph.

