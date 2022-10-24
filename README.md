# opendairy-auth-api

API handling auth on top of AWS Cognito

**WARNING**

*Need refresh-token having 1 month validity on aws side*

If not, you need to modify the cookie duration in auth controller.


## Installation

```bash
$ npm install
```

## Commands

```bash
# run the express server
$ npm run start

# run the express server with .env loading and watch mode
$ npm run start:dev
```


## Environment variables

| name | value | example |
| --- | --- | --- |
| ```NODE_ENV``` | development \|\| production | production |
| ```PORT``` | number | 42001 |
| ```COGNITO_USER_POOL_ID``` | string | eu-central-.... |
| ```COGNITO_CLIENT_ID``` | string | 6sbabcabcabc... |
| ```ORIGIN``` | string (url) | https://########.execute-api.eu-central-1.amazonaws.com |
| ```COOKIE_DOMAIN``` | string (url) | https://########.execute-api.eu-central-1.amazonaws.com |


### Using .env file
While developing, you can pass environment variables using a .env file.
See .env.example at project root folder.   
You MUST use ```npm run start:dev``` when using an .env file.

### Using Windows Powershell
To pass env variables in a Windows Powershell console :
```posh
$env:PORT=42001; $env:NODE_ENV="production"; npm run start
 ```
:warning: The variables will remains after node process exits. You can reset them using command :
```posh
$env:PORT=$null; $env:NODE_ENV=$null
 ```

### Using Linux console
To pass env variables under Linux:
```sh
PORT=42001 NODE_ENV=production npm run start
```
The variables will be set only during the process execution (reset after process ends).

### Using Docker
see Docker deployment below.

### Using cloud services like AWS, Azure, ...
There are many tools allowing you to pass env variables securely using a managed environment. It depends of the service you use. See its documentation.


## Deploy with Docker
This procedure is for deployment on an AWS EC2 instance. The same can be done locally or on any virtual server with Docker installed.

1. **<u>Log on EC2</u>**

Use your favorite SSH tool to access your server instance.


2. **<u>Build the Docker image</u>**


A. **Build the image directly from the Git repo**

```sh
sudo docker build -t opendairy-auth-api:latest https://github.com/Block0-Blockstart/opendairy-auth-api.git
```

B. **Aternative: copy the repo**

* Clone a fresh copy of the git main branch locally.\
DO NOT npm install, as we don't want any node_modules !           

* Then, upload the whole project directory to the EC2 (FileZilla can do this).

* On the EC2, open a console and navigate to the directory you have just copied. Now, build the image:

  ```sh
  sudo docker build -t opendairy-auth-api:latest .
  ``` 

  WARNING: notice the '.' at the end of the command line to instruct Docker to use the Dockerfile in current directory.


3. **<u>Run the image</u>**

You need to pass the environment variables to docker when running the image. There are many options to do this.


* *passing args to the docker run command*

You can pass the required variables directly to the docker run command. Example for NODE_ENV and PORT variables:

```sh
sudo docker run --name opendairy-auth-api \
-it -e NODE_ENV=development -e PORT=42001 \
-p 42001:42001 --restart=unless-stopped \
opendairy-auth-api:latest
```

:warning: Anyone with access to the Docker runtime can inspect a running container and discover the env values. For example:
```sh
$ docker inspect 6b6b033a3240

"Config": {
  // ...
  "Env": [
    "PORT=42001",
    "NODE_ENV=development",
    // ...
  ]
}
```

* *setting the environment variables in Dockerfile*

You can declare your environment variables in the DockerFile. This way, you can run the image with this simple command:

```sh
sudo docker run --name opendairy-auth-api -it -p 42001:42001 --restart=unless-stopped opendairy-auth-api:latest
```
:warning: Anyone with access to the Dockerfile can dicover your values.

* *using a temporary .env file*

Create a .env file at project's root (on the EC2) and pass the file path to the docker run command. Example:

```sh
sudo docker run --name opendairy-auth-api \
-it --env-file=.env \
-p 42001:42001 --restart=unless-stopped \
opendairy-auth-api:latest
```

Then you can delete the .env file, so that nobody can discover your values. This is more secure (see also https://docs.docker.com/engine/swarm/secrets/).

4. **<u>AWS: update security group</u>**

If you use an AWS EC2, don't forget to update your security group rules to open the port used by this api. Add an inbound rule:

| Type | Protocol | Port range | Source | Description (optional) |
| --- | --- | --- | --- | --- |
| Custom TCP | TCP | 42001 | 0.0.0.0/0, ::/0 | Allows connections to opendairy-auth-api

# Contact
**block0**
+ info@block0.io
+ [https://block0.io/](https://block0.io/)

# License
This repository is released under the [MIT License](https://opensource.org/licenses/MIT).
