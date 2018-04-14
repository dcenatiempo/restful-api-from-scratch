# Create a new SSL cert
### (Section 3:21)
  
  openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
  
  Country Name (2 letter code) []:US
  State or Province Name (full name) []:UT
  Locality Name (eg, city) []:Taylorsville
  Organization Name (eg, company) []:Devin Cenatiempo
  Organizational Unit Name (eg, section) []:Devin Cenatiempo
  Common Name (eg, fully qualified host name) []:localhost
  Email Address []:dcenatiempo@gmail.com

# Port conventions:
  - HTTP typically on port 80
  - HTTPS typically on port 443

# Colored Logging
### (Section 3:30)
## Styles
- Reset = "\x1b[0m"
- Bright Color = "\x1b[1m"
- Dim Color = "\x1b[2m"
- Underscore = "\x1b[4m"
- Blink = "\x1b[5m"
- Invert Color/Background = "\x1b[7m"
- Hidden = "\x1b[8m"

## Color
- Black = "\x1b[30m"
- Red = "\x1b[31m"
- Green = "\x1b[32m"
- Yellow = "\x1b[33m"
- Blue = "\x1b[34m"
- Magenta = "\x1b[35m"
- Cyan = "\x1b[36m"
- White = "\x1b[37m"

## Background
- Black = "\x1b[40m"
- Red = "\x1b[41m"
- Green = "\x1b[42m"
- Yellow = "\x1b[43m"
- Blue = "\x1b[44m"
- Magenta = "\x1b[45m"
- Cyan = "\x1b[46m"
- White = "\x1b[47m"

# Conditional Debug logs
### (Section 3:30)
At top of file include:
```
const util    = require('util');
const debug   = util.debuglog('anything');
```
Now instead of console.log, use:
```
debug('Here is the debug message');
```
And start the node application using:
```
NODE_DEBUG=anything node index.js
```
Now node will log out the debug messages in that file


