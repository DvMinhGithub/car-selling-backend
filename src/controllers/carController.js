const fs = require('fs');
const path = require('path');

const carModel = require('#models/car');
const customerModel = require('#models/customer');
const { APP, HTTP_STATUS } = require('#configs/constants');

const resolveBaseUrl = (req) => APP.BASE_URL || `${req.protocol}://${req.get('host')}`;

const resolveStoredPath = (fileUrl) => {
  try {
    return new URL(fileUrl).pathname.replace(/^\/+/, '');
  } catch {
    return String(fileUrl)
      .replace(/^https?:\/\/[^/]+\/?/, '')
      .replace(/^\/+/, '');
  }
};

const normalizeNumber = (value, defaultValue = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
};

const computeAmountPrice = (price, discount) => {
  const normalizedPrice = normalizeNumber(price, 0);
  const normalizedDiscount = normalizeNumber(discount, 0);
  const discountRate = Math.min(Math.max(normalizedDiscount, 0), 100);
  return Math.round((normalizedPrice - (normalizedPrice * discountRate) / 100) * 100) / 100;
};

const applyImageFromUpload = (req, updateData, currentImage) => {
  if (!req.file) return;

  const uploadPublicPath = APP.UPLOAD_PUBLIC_PATH.replace(/^\/+/, '');
  const baseUrl = resolveBaseUrl(req);
  const newImageUrl = `${baseUrl}/${uploadPublicPath}/${req.file.filename}`;
  updateData.carImage = newImageUrl;

  if (currentImage && currentImage !== newImageUrl) {
    const oldImagePath = path.join(
      process.cwd(),
      APP.STATIC_DIR,
      resolveStoredPath(currentImage).replace(/^public\/+/, ''),
    );
    if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
  }
};

const normalizeRating = (value, defaultValue = 5) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.min(Math.max(Math.round(parsed), 1), 5);
};

const sanitizeReviewText = (value) => String(value || '').trim();

const sortReviewsDesc = (reviews = []) => {
  const getTime = (item) => {
    if (item?.createdAt) return new Date(item.createdAt).getTime();
    if (item?._id && typeof item._id.getTimestamp === 'function') {
      return item._id.getTimestamp().getTime();
    }
    return 0;
  };

  return [...reviews].sort((a, b) => getTime(b) - getTime(a));
};

const carController = {
  getAllCar: async (req, res) => {
    try {
      const { name, company, model, color, minPrice, maxPrice, page = 1, limit = 12 } = req.query;

      const query = {};
      if (name) query.name = { $regex: name, $options: 'i' };
      if (company) query.company = { $regex: company, $options: 'i' };
      if (model) query.model = { $regex: model, $options: 'i' };
      if (color) query.color = { $regex: color, $options: 'i' };

      const priceQuery = {};
      const minPriceNumber = Number(minPrice);
      const maxPriceNumber = Number(maxPrice);
      if (Number.isFinite(minPriceNumber)) priceQuery.$gte = minPriceNumber;
      if (Number.isFinite(maxPriceNumber)) priceQuery.$lte = maxPriceNumber;
      if (Object.keys(priceQuery).length > 0) query.amountPrice = priceQuery;

      const pageNumber = Math.max(Number(page) || 1, 1);
      const limitNumber = Math.max(Math.min(Number(limit) || 12, 100), 1);
      const skip = (pageNumber - 1) * limitNumber;

      const [cars, total] = await Promise.all([
        carModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNumber),
        carModel.countDocuments(query),
      ]);

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Lấy danh sách xe thành công',
        data: {
          items: cars,
          pagination: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages: Math.ceil(total / limitNumber),
          },
        },
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  getCarById: async (req, res) => {
    try {
      const id = req.params.id || req.query.id;
      if (!id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Thiếu id xe',
        });
      }

      const carDetail = await carModel.findById(id);
      if (!carDetail) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy xe',
        });
      }

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Lấy chi tiết xe thành công',
        data: carDetail,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  getCarDetail: async (req, res) => {
    return carController.getCarById(req, res);
  },

  getCarReviews: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Thiếu id xe',
        });
      }

      const car = await carModel.findById(id).select('reviewsCustomer');
      if (!car) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy xe',
        });
      }

      const items = sortReviewsDesc(car.reviewsCustomer || []);
      const ratingCount = items.length;
      const averageRating = ratingCount
        ? Math.round(
            (items.reduce((sum, item) => sum + normalizeRating(item?.rating, 5), 0) / ratingCount) *
              10,
          ) / 10
        : 0;

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Lấy danh sách đánh giá thành công',
        data: {
          items,
          total: items.length,
          averageRating,
          ratingCount,
        },
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  createCarReview: async (req, res) => {
    try {
      const { id } = req.params;
      const customerId = req.user?._id;
      const review = sanitizeReviewText(req.body?.review);
      const rating = normalizeRating(req.body?.rating, 5);

      if (!id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Thiếu id xe',
        });
      }

      if (!review) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Nội dung đánh giá không được để trống',
        });
      }

      const [car, customer] = await Promise.all([
        carModel.findById(id),
        customerModel.findById(customerId).select('userName'),
      ]);

      if (!car) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy xe',
        });
      }

      if (!customer) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy khách hàng',
        });
      }

      const existed = (car.reviewsCustomer || []).find(
        (item) => String(item?.idCustomer) === String(customerId),
      );
      if (existed) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: 'Bạn đã đánh giá xe này. Vui lòng cập nhật đánh giá hiện tại.',
        });
      }

      const reviewPayload = {
        idCustomer: customerId,
        nameCustomer: customer.userName || req.user?.userName || 'Khách hàng',
        review,
        rating,
      };

      car.reviewsCustomer.push(reviewPayload);
      await car.save();

      await customerModel.findByIdAndUpdate(customerId, {
        $pull: { reviewCustomer: { idProduct: car._id } },
      });
      await customerModel.findByIdAndUpdate(customerId, {
        $push: {
          reviewCustomer: {
            idProduct: car._id,
            review,
            rating,
          },
        },
      });

      const createdReview = car.reviewsCustomer[car.reviewsCustomer.length - 1];
      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Đánh giá xe thành công',
        data: createdReview,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  updateCarReview: async (req, res) => {
    try {
      const { id, reviewId } = req.params;
      const customerId = req.user?._id;
      const reviewText = sanitizeReviewText(req.body?.review);
      const rating = normalizeRating(req.body?.rating, 5);

      if (!id || !reviewId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Thiếu id xe hoặc reviewId',
        });
      }

      if (!reviewText) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Nội dung đánh giá không được để trống',
        });
      }

      const car = await carModel.findById(id);
      if (!car) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy xe',
        });
      }

      const reviewDoc = (car.reviewsCustomer || []).find(
        (item) =>
          String(item?._id) === String(reviewId) && String(item?.idCustomer) === String(customerId),
      );

      if (!reviewDoc) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy đánh giá của bạn để cập nhật',
        });
      }

      reviewDoc.review = reviewText;
      reviewDoc.rating = rating;
      await car.save();

      await customerModel.findOneAndUpdate(
        { _id: customerId, 'reviewCustomer.idProduct': car._id },
        {
          $set: {
            'reviewCustomer.$.review': reviewText,
            'reviewCustomer.$.rating': rating,
          },
        },
      );

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Cập nhật đánh giá thành công',
        data: reviewDoc,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  deleteCarReview: async (req, res) => {
    try {
      const { id, reviewId } = req.params;
      const customerId = req.user?._id;

      if (!id || !reviewId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Thiếu id xe hoặc reviewId',
        });
      }

      const car = await carModel.findById(id);
      if (!car) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy xe',
        });
      }

      const index = (car.reviewsCustomer || []).findIndex(
        (item) =>
          String(item?._id) === String(reviewId) && String(item?.idCustomer) === String(customerId),
      );

      if (index === -1) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy đánh giá của bạn để xóa',
        });
      }

      const [removedReview] = car.reviewsCustomer.splice(index, 1);
      await car.save();

      await customerModel.findByIdAndUpdate(customerId, {
        $pull: { reviewCustomer: { idProduct: car._id } },
      });

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Xóa đánh giá thành công',
        data: removedReview,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  createCar: async (req, res) => {
    try {
      const { name, price, discount = 0 } = req.body;
      if (!name || price === undefined) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc: name, price',
        });
      }

      const payload = { ...req.body };
      payload.amountPrice = computeAmountPrice(price, discount);
      applyImageFromUpload(req, payload);

      const carCreated = await carModel.create(payload);
      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Tạo xe thành công',
        data: carCreated,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  updateCar: async (req, res) => {
    try {
      const id = req.params.id || req.query.id;
      if (!id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Thiếu id xe',
        });
      }

      const currentCar = await carModel.findById(id);
      if (!currentCar) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy xe',
        });
      }

      const updateData = { ...req.body };
      const nextPrice = updateData.price !== undefined ? updateData.price : currentCar.price;
      const nextDiscount =
        updateData.discount !== undefined ? updateData.discount : currentCar.discount || 0;
      updateData.amountPrice = computeAmountPrice(nextPrice, nextDiscount);

      applyImageFromUpload(req, updateData, currentCar.carImage);

      const carUpdate = await carModel.findByIdAndUpdate(id, { $set: updateData }, { new: true });
      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Cập nhật xe thành công',
        data: carUpdate,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  deleteCar: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedCar = await carModel.findByIdAndDelete(id);

      if (!deletedCar) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy xe',
        });
      }

      if (deletedCar.carImage) {
        const oldImagePath = path.join(
          process.cwd(),
          APP.STATIC_DIR,
          resolveStoredPath(deletedCar.carImage).replace(/^public\/+/, ''),
        );
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Xóa xe thành công',
        data: deletedCar,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = carController;
