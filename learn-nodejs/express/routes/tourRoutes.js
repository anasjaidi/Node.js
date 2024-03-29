const express = require('express')
const {
  getAllTours,
  postTour,
  getTour,
  updateTour,
  deleteTour,
  // aliasTopTours,
  getTourStats,
  getMonthlyPlan,
} = require('../controllers/tourController')

const router = express.Router()

// router.route('/top-5-cheap').get(aliasTopTours, getAllTours)

router.route('/tour-stats').get(getTourStats)
router.route('/monthly-plan/:year').get(getMonthlyPlan)

// router.param('id', checkID)

router.route('/').get(getAllTours).post(postTour)

router.route('/:id').get(getTour).patch(updateTour).delete(deleteTour)

module.exports = router
