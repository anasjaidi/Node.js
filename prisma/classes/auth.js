const bcrypt = require("bcryptjs");
const prismaUsersClient = require("../classes/prismaUsersClient");
const jwt = require("jsonwebtoken");
const AppError = require("../errors/AppError");
const { promisify } = require("util");
class Auth {
	constructor() {}

	async signup(body) {
		const { firstName, lastName, email } = body;

		const password = await this.hashPassword(body.password, 12);

		const newUser = await prismaUsersClient.addUser({
			firstName,
			lastName,
			email,
			password,
		});

		const token = this.generateToken(newUser.uid);

		return { newUser, token };
	}

	async signin(body) {
		const { email, password } = body;

		const user = await prismaUsersClient.findUserByMail(email);

		if (!user || !(await this.checkPassword(password, user.password)))
			throw new AppError(400, "email, or password not valid"); // be vague

		const token = this.generateToken(user.uid);

		return { token, conversations: user.conversations };
	}

	async protectRoute(req, res, next) {
		// check if token exists
		if (
			!req.headers.authorization ||
			!req.headers.authorization.startsWith("Bearer")
		)
			next(new AppError(401, "please provide a token."));

		// get token
		const token = req.headers.authorization.split(" ")[1];

		if (!token) next(new AppError(401, "please provide a token."));

		const decoded = await promisify(jwt.verify)(
			token,
			process.env.JWT_SECRET_KEY
		);

		// check if user still in db

		const user = await prismaUsersClient.findUserByUid(decoded.id);

		if (!user) next(new AppError(401, "no user associated with this toke."));

		// check if password changed after the token was issued
		if (user.passwordChangeAt) {
			if (parseInt(user.passwordChangeAt.getTime() / 1000, 10) > decoded.iat)
				next(
					new AppError(
						401,
						"password changes after the token was issued please, re sign in."
					)
				);
		}

		// add user
		req.user = user;

		next();
	}

	async hashPassword(pass, salt) {
		return await bcrypt.hash(pass, salt);
	}

	async checkPassword(candidatePassword, password) {
		return await bcrypt.compare(candidatePassword, password);
	}

	generateToken(payload) {
		return jwt.sign({ id: payload }, process.env.JWT_SECRET_KEY, {
			expiresIn: process.env.JWT_EXPIRES_IN,
		});
	}
}

const authDAO = new Auth();

module.exports = authDAO;
