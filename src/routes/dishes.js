const express = require('express');
const router = express.Router();
const { 
  getDishes, 
  getDish, 
  createDish, 
  updateDish, 
  deleteDish,
  getDishesByRestaurant,
  getAvailableDishes,
  scheduleDish,
  getDishSchedule,
  getDishesByDayOfWeek
} = require('../controllers/dishes');

// Middleware d'authentification
const { protect, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Dishes
 *   description: API pour gérer les plats
 */

/**
 * @swagger
 * /api/dishes/available:
 *   get:
 *     summary: Obtenir les plats disponibles aujourd'hui
 *     tags: [Dishes]
 *     responses:
 *       200:
 *         description: Liste des plats disponibles aujourd'hui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Dish'
 */
router.route('/available')
  .get(getAvailableDishes);

/**
 * @swagger
 * /api/dishes/available/day/{dayOfWeek}:
 *   get:
 *     summary: Obtenir les plats disponibles un jour spécifique de la semaine
 *     tags: [Dishes]
 *     parameters:
 *       - in: path
 *         name: dayOfWeek
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 6
 *         required: true
 *         description: Jour de la semaine (0 = dimanche, 6 = samedi)
 *     responses:
 *       200:
 *         description: Liste des plats disponibles le jour spécifié
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Dish'
 *       400:
 *         description: Jour de la semaine invalide
 */
router.route('/available/day/:dayOfWeek')
  .get(getDishesByDayOfWeek);

/**
 * @swagger
 * /api/dishes/restaurant/{restaurantId}:
 *   get:
 *     summary: Obtenir les plats d'un restaurant spécifique
 *     tags: [Dishes]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du restaurant
 *     responses:
 *       200:
 *         description: Liste des plats du restaurant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Dish'
 *       404:
 *         description: Restaurant non trouvé
 */
router.route('/restaurant/:restaurantId')
  .get(getDishesByRestaurant);

/**
 * @swagger
 * /api/dishes/{id}/schedule:
 *   get:
 *     summary: Obtenir la programmation hebdomadaire d'un plat
 *     tags: [Dishes]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du plat
 *     responses:
 *       200:
 *         description: Programmation hebdomadaire du plat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WeeklySchedule'
 *       404:
 *         description: Plat non trouvé
 *   post:
 *     summary: Définir la programmation hebdomadaire d'un plat
 *     tags: [Dishes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du plat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - schedule
 *             properties:
 *               schedule:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - dayOfWeek
 *                   properties:
 *                     dayOfWeek:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 6
 *                     isAvailable:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Programmation mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Dish'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Plat non trouvé
 */
router.route('/:id/schedule')
  .get(getDishSchedule)
  .post(protect, authorize('owner', 'admin'), scheduleDish);

/**
 * @swagger
 * /api/dishes:
 *   get:
 *     summary: Obtenir tous les plats
 *     tags: [Dishes]
 *     parameters:
 *       - in: query
 *         name: dietaryOptions
 *         schema:
 *           type: string
 *         description: Filtrer par options diététiques (ex. vegetarian,vegan)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Trier les résultats (ex. price,desc)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page à afficher
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Nombre de plats par page
 *     responses:
 *       200:
 *         description: Liste des plats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalResults:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Dish'
 *   post:
 *     summary: Créer un nouveau plat
 *     tags: [Dishes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - restaurant
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *               dietaryOptions:
 *                 type: array
 *                 items:
 *                   type: string
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *               isAvailable:
 *                 type: boolean
 *               restaurant:
 *                 type: string
 *     responses:
 *       201:
 *         description: Plat créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Dish'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 */
router.route('/')
  .get(getDishes)
  .post(protect, authorize('owner', 'admin'), createDish);

/**
 * @swagger
 * /api/dishes/{id}:
 *   get:
 *     summary: Obtenir un plat par son ID
 *     tags: [Dishes]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du plat
 *     responses:
 *       200:
 *         description: Détails du plat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Dish'
 *       404:
 *         description: Plat non trouvé
 *   put:
 *     summary: Mettre à jour un plat
 *     tags: [Dishes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du plat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *               dietaryOptions:
 *                 type: array
 *                 items:
 *                   type: string
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *               isAvailable:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Plat mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Dish'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Plat non trouvé
 *   delete:
 *     summary: Supprimer un plat
 *     tags: [Dishes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du plat
 *     responses:
 *       200:
 *         description: Plat supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data: {}
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Plat non trouvé
 */
router.route('/:id')
  .get(getDish)
  .put(protect, authorize('owner', 'admin'), updateDish)
  .delete(protect, authorize('owner', 'admin'), deleteDish);

module.exports = router;
