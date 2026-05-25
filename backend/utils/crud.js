const createCRUD = (table) => {
  return {
    getAll: async (req, res, pool) => {
      try {
        const result = await pool.query(`SELECT * FROM ${table}`);
        res.json(result.rows);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    getById: async (req, res, pool) => {
      try {
        const result = await pool.query(
          `SELECT * FROM ${table} WHERE id = $1`,
          [req.params.id]
        );
        res.json(result.rows[0]);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    delete: async (req, res, pool) => {
      try {
        await pool.query(
          `DELETE FROM ${table} WHERE id = $1`,
          [req.params.id]
        );
        res.json({ message: 'Deleted' });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    }
  };
};

module.exports = createCRUD;