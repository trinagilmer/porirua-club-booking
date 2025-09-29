// routes/dashboard.js
router.get('/dashboard', async (req, res, next) => {
  try {
    const { rows: functions } = await pool.query(`
      WITH sv AS (
        SELECT function_id, SUM(price * COALESCE(quantity,1)) AS total_services
        FROM function_services
        GROUP BY function_id
      ),
      mn AS (
        SELECT function_id, SUM(price * COALESCE(quantity,1)) AS total_menus
        FROM function_menus
        GROUP BY function_id
      )
      SELECT
        f.id,
        b.id               AS booking_id,
        f.event_name,
        f.room_name,
        f.guest_count      AS pax,
        f.status,
        f.start_at::date   AS date,
        COALESCE(sv.total_services,0) + COALESCE(mn.total_menus,0) AS est_total
      FROM functions f
      LEFT JOIN bookings b ON b.id = f.booking_id
      LEFT JOIN sv ON sv.function_id = f.id
      LEFT JOIN mn ON mn.function_id = f.id
      WHERE f.status IN ('pending','confirmed')
      ORDER BY f.start_at ASC, f.id ASC
    `);

    res.render('pages/dashboard', { functions });
  } catch (err) {
    next(err);
  }
});
