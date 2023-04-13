module.exports = {
  getAllCars: async (req, res, next) => {
    try {
      return res.status(200).json({ message: "Get all car" });
    } catch (error) {
      next(error);
    }
  },
};
