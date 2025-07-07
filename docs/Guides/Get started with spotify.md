(Keep in mind that current implementation of spotify module might get changed)

Okay To get started we have to create a user in the system. If you already have user credentials you can skip to [[#Getting Access Token of User]] 

### Creating a user

#### Option 1: Use Postman

You can create a new POST request in Postman with the following settings:

- **Method**: `POST`
- **URL**: `http://localhost:3000/auth/register`
- **Headers**: (set `Content-Type: application/json`)
- **Body**: Select `raw` → `JSON` and paste the following:

```
{   
	"username": "john",
	"email": "johndoe@gmail.com",
	"role": "admin",
	"password": "123456" 
}
```

_(Replace values like `john`, `johndoe@gmail.com`, etc. with your own variables as needed.)_

---
#### Option 2: Use cURL in Terminal

Alternatively, you can use this cURL command in your terminal:

```
curl -X POST http://localhost:3000/auth/register \
	-H "Content-Type: application/json" \
	-d '{     
		"username": "john",     
		"email": "johndoe@gmail.com",     
		"role": "admin",     
		"password": "123456" 
	}'
```

Replace `"john"`, `"johndoe@gmail.com"`, etc. with your own variables:
- `<USERNAME>`
- `<EMAIL>`
- `<ROLE>`
- `<PASSWORD>`

There is no current frontend implementation of register so you are stuck with these


### Getting Access Token of User

Now that you have a user registered in the system you can go ahead and log into the user using the endpoint `POST http://localhost:3000/auth/login`

#### Option 1: Use Postman

1. **Method**: `POST`
2. **URL**: `http://localhost:3000/auth/login`
3. **Headers**: `Content-Type: application/json`
4. **Body** (raw → JSON):

```
{   
	"email": "ravindupeeris180@gmail.com",   
	"password": "123456" 
}
```

---

#### Option 2: Use cURL in Terminal

You can run this cURL command in your terminal:
```

curl -X POST http://localhost:3000/auth/login   -H "Content-Type: application/json"   -d '{     "email": "johndoe@gmail.com",     "password": "123456" }'

```


---

#### Sample Successful Response

```
{   
	"message": "Authentication successful",   
	"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODVmYjciMDg0YmE3ZTBlZi1j1MzMiLCJleHAiOjE3NTE5MTI4NDksInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzUxOTE5OTQ5fQ",   
	"user": {     
		"id": "685fb750cc084ba7e0ef8533",     
		"name": "owl",     
		"email": "ravindupeeris180@gmail.com",     
		"role": "user"   
	} 
}
```

You’ll find your **JWT access token** in the `accessToken` field. You can either store this in a environment variable in your postman environment or copy this to clipboard to use in next few steps


### Log into Spotify

Next you have to authorize access to your spotify account. This can be done by using the endpoint `POST http://localhost:3000/spotify/login`

Using curl, we will call the endpoint with the access token we retrieved from the previous steps.

To call this endpoint, use the following command in your terminal:

```
curl -X POST http://localhost:3000/spotify/login -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODVmYjc1MGNjMDg0YmE3ZTBlZjg1MzMiLCJleHAiOjE3NTE5MjExODUsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzUxOTIwMjg1fQ.-0lvMENsJtwmNVCdmo2ACOzibJ_lAFZWDQlwdsNMlQs"
```

Make sure your `Authorization` header follows this exact format:

```
Authorization: Bearer <your-access-token>
```


If the token is valid and not expired, the request should go through s525448uccessfully and you will see something like this

```
Found. Redirecting to <SPOTIFY-LINK>
```

Shift+Click on the spotify link to redirect yourself to spotify access web page. Go along and grant access to Noot. After thats done you should have created a access token in memory for your login and a refresh token entry in the database for future accesses.

### Testing out

Now you can access spotify endpoints by sending the access token you received in [[#Getting Access Token of User]]

To test this, We will be calling the `/spotify/whoami` endpoint. This will internally call Spotify's **Web API** to fetch your user profile.

#### Option 1: Using Postman

1. **Method**: `GET`
2. **URL**: `http://localhost:3000/spotify/whoami`
3. **Headers**:

| Key           | Value                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Authorization | `Bearer {{accessToken}}` _(Replace with the actual token or saved environment variable)_ |

**Example:**
If you've stored your token in a Postman Environment using the Postman post script from the login request:

```
Authorization: Bearer {{accessToken}}
```

Otherwise, paste the raw token directly:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---
#### Option 2: Using cURL in Terminal

You can run this cURL command in the terminal

```
curl -X GET localhost:3000/spotify/whoami -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODVmYjc1MGNjMDg0YmE3ZTBlZjg1MzMiLCJleHAiOjE3NTE5MjExODUsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzUxOTIwMjg1fQ.-0lvMENsJtwmNVCdmo2ACOzibJ_lAFZWDQlwdsNMlQs"
```

Make sure your `Authorization` header follows this exact format:

```
Authorization: Bearer <your-access-token>
```

