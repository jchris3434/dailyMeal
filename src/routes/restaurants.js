const express = require('express');
const router = express.Router();
const { 
  getRestaurants, 
  getRestaurant, 
  createRestaurant, 
  updateRestaurant, 
  deleteRestaurant,
  getRestaurantsInRadius
} = require('../controllers/restaurants');

// Middleware d'authentification
const { protect, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Restaurants
 *   description: API pour gérer les restaurants
 */

/**
 * @swagger
 * /api/restaurants/radius/{coordinates}/{distance}:
 *   get:
 *     summary: Obtenir les restaurants dans un rayon donné
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: coordinates
 *         schema:
 *           type: string
 *         required: true
 *         description: Coordonnées au format 'latitude,longitude'
 *       - in: path
 *         name: distance
 *         schema:
 *           type: number
 *         required: true
 *         description: Distance en kilomètres
 *     responses:
 *       200:
 *         description: Liste des restaurants dans le rayon spécifié
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
 *                     $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Coordonnées invalides
 */
router.route('/radius/:coordinates/:distance')
  .get(getRestaurantsInRadius);

/**
 * @swagger
 * /api/restaurants:
 *   get:
 *     summary: Obtenir tous les restaurants
 *     tags: [Restaurants]
 *     parameters:
 *       - in: query
 *         name: cuisine
 *         schema:
 *           type: string
 *         description: Filtrer par type de cuisine
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Trier les résultats (ex. name,desc)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page à afficher
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Nombre de restaurants par page
 *     responses:
 *       200:
 *         description: Liste des restaurants
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
 *                     $ref: '#/components/schemas/Restaurant'
 *   post:
 *     summary: Créer un nouveau restaurant
 *     tags: [Restaurants]
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
 *               - address
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [Point]
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               website:
 *                 type: string
 *               cuisine:
 *                 type: array
 *                 items:
 *                   type: string
 *               openingHours:
 *                 type: object
 *     responses:
 *       201:
 *         description: Restaurant créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 */
router.route('/')
  .get(getRestaurants)
  .post(protect, authorize('owner', 'admin'), createRestaurant);

/**
 * @swagger
 * /api/restaurants/{id}:
 *   get:
 *     summary: Obtenir un restaurant par son ID
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du restaurant
 *     responses:
 *       200:
 *         description: Détails du restaurant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Restaurant'
 *       404:
 *         description: Restaurant non trouvé
 *   put:
 *     summary: Mettre à jour un restaurant
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du restaurant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               website:
 *                 type: string
 *               cuisine:
 *                 type: array
 *                 items:
 *                   type: string
 *               openingHours:
 *                 type: object
 *     responses:
 *       200:
 *         description: Restaurant mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Restaurant non trouvé
 *   delete:
 *     summary: Supprimer un restaurant
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du restaurant
 *     responses:
 *       200:
 *         description: Restaurant supprimé avec succès
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
 *         description: Restaurant non trouvé
 */
router.route('/:id')
  .get(getRestaurant)
  .put(protect, authorize('owner', 'admin'), updateRestaurant)
  .delete(protect, authorize('owner', 'admin'), deleteRestaurant);

module.exports = router;
