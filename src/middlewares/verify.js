const jwt = require('jsonwebtoken');
const { expressjwt: jwt } = require("express-jwt");

const verify = jwt({
    secret: "secret",
    algorithms: ["HS256"],
    getToken: function fromHeaderOrQuerystring(req) {
      if (
        req.headers.authorization &&
        req.headers.authorization.split(" ")[0] === "Bearer"
      ) {
        return req.headers.authorization.split(" ")[1];
      } else if (req.query && req.query.token) {
        return req.query.token;
      }
      return null;
    },
  })

const role = (req,res,next)=>{
    const role= req.auth.data.role
    if(role != 'admin'){
        res.send({message: 'ban ko co quyen admin'})
    }
    else{
        return next()
    }

}
module.exports={
    verify,
    role
}