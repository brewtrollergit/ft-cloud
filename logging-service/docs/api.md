# ft-cloud API

The ft-cloud API provides access to logging data from associated FermTroller and BrewTroller devices. Users of the API can download logging data in a variety time spans and increments.

## Documentation Generation

The HTML version of this documentation is generated using [restdown](https://github.com/trentm/restdown). The command to generate the documentation is:

	> restdown -m docs docs/API.md
	
## Common Elements

### Data Format

All data returned by this API is in JSON format.

### Dates

Dates are to be specified as strings in ISO 8601 format. Example: "2013-11-15T05:24:18.660Z"

### Paging

Many of the API routes return their data in pages. Page size is fixed by the application and defaults to 100 records. When a route returns it's data in pages the response will include information about the number of records returned, the current index into the result set and the total size of the result set. Using this information it is possible to interate through an entire result set.

An example result set with paging is shown below:

    {
        "total" : 1000,
        "index" : 0,
        "length" : 100,
        "results" : [
            // 100 result records
        ]
    }

To iterate through a result set, simply call the route with no `index`, or `index=0` and then for each additional page, add `length` to the `index` until you have reached `total` results.

# Logs

Logs are time series data points that have been logged by an associated device. The format of the data depends on the type of device although there are some common properties across devices. Logs are the raw data received by the service from devices. When requesting Logs no time series processing is performed.

## Get All Logs (GET /v0/:id/logs)

Get an array of all Logs, optionally filtered by a date range. By default, the route returns data for the last 24 hours.

Note: When using this route it is recommended that *from* and *to* always be specified. Since the default *to* is the date when the route was called, if you do not specify a fixed time span than you can end up with a changing result set size over time.

Response data is always returned sorted by timestamp with the newest data first.

#### Parameters

* **id**: (64 bit ID, Base 36 encoded) [Required] - Return data for the given device ID.
* **from**: (Date) [Optional] - Returns only logs on or after the given from. Defaults to `now - 24h`.
* **to**: (Date) [Optional] - Returns only logs on or before the given to. Defaults to `now`.
* **index**: (Number) [Optional] - The index within the paged result set to start with. Defaults to `0`.

#### Response

    {
        "total" : 1000,
        "index" : 0,
        "length" : 100,
        "id" : "3w5e11264sg0g",
        "from" : "2013-11-14T05:24:18.660Z",
        "to" : "2013-11-15T05:24:18.660Z"
        "results" : [
            {"v":1,"z6":{"s":"15.08"}}
            {"v":1,"z0":{"s":"32.28"}}
            {"v":1,"z2":{"n":"Boiler"}}
        ]
    }

# Intervals

Intervals are log data that has been processed and filtered to provide a series of data for one or more variables for a given time span at a certain interval. Values are repeated or collapsed as needed to match the specified interval.

## Get Named Interval (GET /v0/:id/intervals/:interval)

Get series data for device specified by *:id* at the interval specified by *:interval*. Intervals are expressed in **Remember the Milk** time shorthand. This shorthand consists of a number followed by a single character expressing a unit of time. Valid units of time are:

* s: Seconds
* m: Minutes
* h: Hours
* d: Days

Examples:

* 2h: Two hours
* 3m: Three minutes
* 17d: Seventeen days
* 30s: Thirty seconds

#### Parameters

* **id**: (String) [Required] - Return data for the given device ID.
* **from**: (Date) [Optional] - Return data in the timespan starting with the given date. Defaults to 24 hours ago.
* **to**: (Date) [Optional] - Return data in the timespan ending with the given date. Defaults to the current time.
* **index**: (Number) [Optional] - The index within the paged result set to start with. Defaults to `0`.
* **live**: (Boolean) [Optional] - When set to true, the connection will be left open and new data will be streamed at the interval specified. Defaults to `false`.

#### Response

    {
    
    }

