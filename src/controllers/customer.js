const customerModel = require('../models/customer')
const bcrypt = require('bcrypt')

const customerController = {
    register: async (req, res) => {
        try {
            const { userName, phoneNumber, email, address, password } = req.body
            const checkEmail = await customerModel.findOne(email)
            if (checkEmail) {
                return res
                    .status(404)
                    .json({ success: false, message: "Email already exists" });
            } else {
                const hashPassword = bcrypt.hash(password, 10)
                await customerModel.create({ userName, email, phoneNumber, address, hashPassword })
                return res.status(200)
                    .json({ success: true, message: "Register success" })
            }
        } catch (error) {
            res.send(error)
        }
    }
}

module.exports = { customerController }