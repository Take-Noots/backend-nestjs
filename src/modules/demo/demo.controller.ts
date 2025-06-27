/*

Controllers are responsible for handling incoming requests and sending responses back to the client.

Some annotation to look out for

@Controller() - A decorator that marks a class as a Nest controller. Required to define a basic controller. Can give an argument to specify the route prefix for all routes in the controller.
@Get() - A decorator that marks a method as a route handler for GET requests. Can give an argument to specify the route path.
@Post() - A decorator that marks a method as a route handler for POST requests. Can give an argument to specify the route path.

For more information, refer to the NestJS documentation: https://docs.nestjs.com/controllers

*/