// src/controllers/outfitController.js

const pool = require('../config/db');


/**
 * POST /api/outfits
 * Creates a new outfit and saves the selected clothing
 * items along with their canvas positions.
 */
async function createOutfit(req, res) {

  const client = await pool.connect();

  try {

    const userId = req.user.user_id;

    const {
      outfit_name,
      occasion,
      item_ids,
      item_positions
    } = req.body;


    // ============================================
    // VALIDATION
    // ============================================

    if (
      !outfit_name ||
      !Array.isArray(item_ids) ||
      item_ids.length === 0
    ) {

      return res.status(400).json({
        error:
          'outfit_name and at least one clothing item are required.'
      });

    }


    await client.query('BEGIN');


    // ============================================
    // CREATE OUTFIT
    // ============================================

    const outfitResult = await client.query(
      `
      INSERT INTO outfit
        (
          user_id,
          outfit_name,
          occasion,
          favourite
        )

      VALUES
        (
          $1,
          $2,
          $3,
          false
        )

      RETURNING
        outfit_id,
        user_id,
        outfit_name,
        occasion,
        created_at,
        favourite
      `,
      [
        userId,
        outfit_name,
        occasion || null
      ]
    );


    const outfit = outfitResult.rows[0];


    console.log(
      'Created outfit:',
      outfit
    );


    // ============================================
    // CHECK OUTFIT ID
    // ============================================

    if (
      !outfit ||
      !outfit.outfit_id
    ) {

      await client.query('ROLLBACK');

      return res.status(500).json({
        error:
          'Could not retrieve the newly created outfit ID.'
      });

    }


    // ============================================
    // CHECK CLOTHING ITEMS
    // ============================================

    const clothingResult = await client.query(
      `
      SELECT item_id
      FROM clothing

      WHERE item_id = ANY($1::bigint[])
        AND user_id = $2
      `,
      [
        item_ids,
        userId
      ]
    );


    if (
      clothingResult.rows.length !==
      item_ids.length
    ) {

      await client.query('ROLLBACK');

      return res.status(400).json({
        error:
          'One or more selected clothing items are invalid.'
      });

    }


    // ============================================
    // SAVE CLOTHING ITEMS + POSITIONS
    // ============================================

    for (let i = 0; i < item_ids.length; i++) {

      const itemId = item_ids[i];


      // Find the saved position for this clothing item
      const position =
        Array.isArray(item_positions)
          ? item_positions.find(
              p =>
                Number(p.item_id) ===
                Number(itemId)
            )
          : null;


      const positionX =
        position?.position_x ?? 0;


      const positionY =
        position?.position_y ?? 0;


      const zIndex =
        position?.z_index ?? (i + 1);


      await client.query(
        `
        INSERT INTO outfit_item
          (
            outfit_id,
            item_id,
            position_x,
            position_y,
            z_index
          )

        VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5
          )
        `,
        [
          outfit.outfit_id,
          itemId,
          positionX,
          positionY,
          zIndex
        ]
      );

    }


    // ============================================
    // COMMIT
    // ============================================

    await client.query('COMMIT');


    // ============================================
    // RESPONSE
    // ============================================

    return res.status(201).json({

      message:
        'Outfit created successfully.',

      outfit:
        outfit

    });


  } catch (error) {

    try {

      await client.query('ROLLBACK');

    } catch (rollbackError) {

      console.error(
        'Rollback error:',
        rollbackError
      );

    }


    console.error(
      'Error in createOutfit():',
      error
    );


    return res.status(500).json({
      error:
        'Internal server error.'
    });


  } finally {

    client.release();

  }

}


/**
 * GET /api/outfits
 * Returns all outfits belonging to the logged-in user.
 *
 * Also returns clothing items and their saved canvas
 * positions.
 */
async function getAllOutfits(req, res) {

  try {

    const userId =
      req.user.user_id;


    const result =
      await pool.query(
        `
        SELECT
          o.outfit_id,
          o.user_id,
          o.outfit_name,
          o.occasion,
          o.created_at,
          o.favourite,

          COALESCE(
            json_agg(
              json_build_object(
                'item_id', c.item_id,
                'name', c.name,
                'category', c.category,
                'colour', c.colour,
                'season', c.season,
                'price', c.price,
                'image', c.image,
                'size', c.size,
                'occasion', c.occasion,
                'extra_info', c.extra_info,
                'position_x', oi.position_x,
                'position_y', oi.position_y,
                'z_index', oi.z_index
              )
              ORDER BY oi.z_index
            )
            FILTER (
              WHERE c.item_id IS NOT NULL
            ),
            '[]'::json
          ) AS items

        FROM outfit o

        LEFT JOIN outfit_item oi
          ON o.outfit_id = oi.outfit_id

        LEFT JOIN clothing c
          ON oi.item_id = c.item_id
          AND c.user_id = o.user_id

        WHERE o.user_id = $1

        GROUP BY
          o.outfit_id,
          o.user_id,
          o.outfit_name,
          o.occasion,
          o.created_at,
          o.favourite

        ORDER BY o.created_at DESC
        `,
        [
          userId
        ]
      );


    return res.status(200).json({

      outfits:
        result.rows

    });


  } catch (error) {

    console.error(
      'Error in getAllOutfits():',
      error
    );


    return res.status(500).json({
      error:
        'Internal server error.'
    });

  }

}


/**
 * GET /api/outfits/:outfit_id
 * Returns one outfit along with its clothing items
 * and saved canvas positions.
 */
async function getOutfitById(req, res) {

  try {

    const userId =
      req.user.user_id;


    const {
      outfit_id
    } = req.params;


    // ============================================
    // GET OUTFIT
    // ============================================

    const outfitResult =
      await pool.query(
        `
        SELECT *
        FROM outfit

        WHERE outfit_id = $1
          AND user_id = $2
        `,
        [
          outfit_id,
          userId
        ]
      );


    if (
      outfitResult.rows.length === 0
    ) {

      return res.status(404).json({
        error:
          'Outfit not found.'
      });

    }


    const outfit =
      outfitResult.rows[0];


    // ============================================
    // GET CLOTHING ITEMS + POSITIONS
    // ============================================

    const itemsResult =
      await pool.query(
        `
        SELECT
          c.*,
          oi.position_x,
          oi.position_y,
          oi.z_index

        FROM clothing c

        INNER JOIN outfit_item oi
          ON c.item_id = oi.item_id

        WHERE oi.outfit_id = $1
          AND c.user_id = $2

        ORDER BY oi.z_index
        `,
        [
          outfit_id,
          userId
        ]
      );


    return res.status(200).json({

      outfit:
        outfit,

      items:
        itemsResult.rows

    });


  } catch (error) {

    console.error(
      'Error in getOutfitById():',
      error
    );


    return res.status(500).json({
      error:
        'Internal server error.'
    });

  }

}


/**
 * PUT /api/outfits/:outfit_id
 * Updates outfit details, clothing items,
 * and their canvas positions.
 */
/**
 * PUT /api/outfits/:outfit_id
 * Updates outfit details, clothing items and their canvas positions.
 */
async function updateOutfit(req, res) {

  const client =
    await pool.connect();


  try {

    const userId =
      req.user.user_id;

    const {
      outfit_id
    } = req.params;


    const {
      outfit_name,
      occasion,
      item_ids,
      item_positions
    } = req.body;


    // ============================================
    // VALIDATION
    // ============================================

    if (
      !outfit_name ||
      !Array.isArray(item_ids) ||
      item_ids.length === 0
    ) {

      return res.status(400).json({
        error:
          'outfit_name and at least one clothing item are required.',
      });

    }


    await client.query(
      'BEGIN'
    );


    // ============================================
    // CHECK OUTFIT OWNERSHIP
    // ============================================

    const outfitCheck =
      await client.query(
        `
        SELECT *
        FROM outfit

        WHERE outfit_id = $1
          AND user_id = $2
        `,
        [
          outfit_id,
          userId
        ]
      );


    if (
      outfitCheck.rows.length === 0
    ) {

      await client.query(
        'ROLLBACK'
      );

      return res.status(404).json({
        error:
          'Outfit not found.',
      });

    }


    // ============================================
    // CHECK CLOTHING OWNERSHIP
    // ============================================

    const clothingResult =
      await client.query(
        `
        SELECT item_id
        FROM clothing

        WHERE item_id = ANY($1::bigint[])
          AND user_id = $2
        `,
        [
          item_ids,
          userId
        ]
      );


    if (
      clothingResult.rows.length !==
      item_ids.length
    ) {

      await client.query(
        'ROLLBACK'
      );

      return res.status(400).json({
        error:
          'One or more selected clothing items are invalid.',
      });

    }


    // ============================================
    // UPDATE OUTFIT DETAILS
    // ============================================

    const updateResult =
      await client.query(
        `
        UPDATE outfit

        SET
          outfit_name = $1,
          occasion = $2

        WHERE outfit_id = $3
          AND user_id = $4

        RETURNING *
        `,
        [
          outfit_name,
          occasion || null,
          outfit_id,
          userId
        ]
      );


    // ============================================
    // REMOVE OLD ITEMS
    // ============================================

    await client.query(
      `
      DELETE FROM outfit_item

      WHERE outfit_id = $1
      `,
      [
        outfit_id
      ]
    );


    // ============================================
    // ADD UPDATED ITEMS + POSITIONS
    // ============================================

    for (
      const itemId of item_ids
    ) {

      const position =
        Array.isArray(item_positions)
          ? item_positions.find(
              item =>
                Number(item.item_id) ===
                Number(itemId)
            )
          : null;


      const positionX =
        position &&
        position.position_x !== undefined
          ? Number(position.position_x)
          : 0;


      const positionY =
        position &&
        position.position_y !== undefined
          ? Number(position.position_y)
          : 0;


      const zIndex =
        position &&
        position.z_index !== undefined
          ? Number(position.z_index)
          : 1;


      await client.query(
        `
        INSERT INTO outfit_item
        (
          outfit_id,
          item_id,
          position_x,
          position_y,
          z_index
        )

        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5
        )
        `,
        [
          outfit_id,
          itemId,
          positionX,
          positionY,
          zIndex
        ]
      );

    }


    // ============================================
    // COMMIT
    // ============================================

    await client.query(
      'COMMIT'
    );


    return res.status(200).json({

      message:
        'Outfit updated successfully.',

      outfit:
        updateResult.rows[0],

    });


  } catch (error) {

    await client.query(
      'ROLLBACK'
    );

    console.error(
      'Error in updateOutfit():',
      error
    );

    return res.status(500).json({
      error:
        'Internal server error.',
    });


  } finally {

    client.release();

  }

}

/**
 * DELETE /api/outfits/:outfit_id
 * Deletes an outfit and its clothing associations.
 */
async function deleteOutfit(req, res) {

  const client =
    await pool.connect();


  try {

    const userId =
      req.user.user_id;


    const {
      outfit_id
    } = req.params;


    await client.query(
      'BEGIN'
    );


    // ============================================
    // CHECK OWNERSHIP
    // ============================================

    const outfitResult =
      await client.query(
        `
        SELECT *
        FROM outfit

        WHERE outfit_id = $1
          AND user_id = $2
        `,
        [
          outfit_id,
          userId
        ]
      );


    if (
      outfitResult.rows.length === 0
    ) {

      await client.query(
        'ROLLBACK'
      );


      return res.status(404).json({
        error:
          'Outfit not found.'
      });

    }


    // ============================================
    // DELETE OUTFIT ITEMS
    // ============================================

    await client.query(
      `
      DELETE FROM outfit_item

      WHERE outfit_id = $1
      `,
      [
        outfit_id
      ]
    );


    // ============================================
    // DELETE OUTFIT
    // ============================================

    await client.query(
      `
      DELETE FROM outfit

      WHERE outfit_id = $1
        AND user_id = $2
      `,
      [
        outfit_id,
        userId
      ]
    );


    await client.query(
      'COMMIT'
    );


    return res.status(200).json({

      message:
        'Outfit deleted successfully.',

      outfit_id:
        outfit_id

    });


  } catch (error) {

    try {

      await client.query(
        'ROLLBACK'
      );

    } catch (rollbackError) {

      console.error(
        'Rollback error:',
        rollbackError
      );

    }


    console.error(
      'Error in deleteOutfit():',
      error
    );


    return res.status(500).json({
      error:
        'Internal server error.'
    });


  } finally {

    client.release();

  }

}


/**
 * PATCH /api/outfits/:outfit_id/favourite
 * Toggles an outfit's favourite status.
 */
/**
 * PATCH /api/outfits/:outfit_id/favourite
 * Toggles an outfit's favourite status.
 */
async function toggleFavourite(req, res) {

  try {

    const userId =
      req.user.user_id;

    const {
      outfit_id
    } = req.params;


    const result =
      await pool.query(
        `
        UPDATE outfit

        SET favourite =
          NOT favourite

        WHERE outfit_id = $1
          AND user_id = $2

        RETURNING *
        `,
        [
          outfit_id,
          userId
        ]
      );


    if (
      result.rows.length === 0
    ) {

      return res.status(404).json({
        error:
          'Outfit not found.',
      });

    }


    return res.status(200).json({

      message:
        'Favourite status updated successfully.',

      outfit:
        result.rows[0],

    });


  } catch (error) {

    console.error(
      'Error in toggleFavourite():',
      error
    );

    return res.status(500).json({
      error:
        'Internal server error.',
    });

  }

}


module.exports = {

  createOutfit,

  getAllOutfits,

  getOutfitById,

  updateOutfit,

  deleteOutfit,

  toggleFavourite

};