import { Router } from 'express';
import { db } from '../db/store';

export const datasetsRouter = Router();

// GET /api/datasets
datasetsRouter.get('/datasets', (req, res) => {
  const { category, publisher, country, format, apiAvailable, search, year } = req.query as Record<string, string>;

  let list = Array.from(db.datasets.values());

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.publisher.toLowerCase().includes(q) ||
        (d.topic && d.topic.toLowerCase().includes(q)) ||
        (d.country && d.country.toLowerCase().includes(q))
    );
  }

  if (category && category !== 'All') {
    list = list.filter((d) => d.category.toLowerCase() === category.toLowerCase());
  }

  if (publisher && publisher !== 'All') {
    list = list.filter((d) => d.publisher.toLowerCase().includes(publisher.toLowerCase()));
  }

  if (country && country !== 'All') {
    list = list.filter((d) => d.country?.toLowerCase() === country.toLowerCase());
  }

  if (format && format !== 'All') {
    list = list.filter((d) => d.format.toLowerCase() === format.toLowerCase());
  }

  if (apiAvailable === 'true') {
    list = list.filter((d) => d.apiAvailable === true);
  }

  if (year) {
    list = list.filter((d) => d.year === Number(year));
  }

  // Categories count summary for UI filter badges
  const allDatasets = Array.from(db.datasets.values());
  const categoriesCount: Record<string, number> = {};
  allDatasets.forEach((d) => {
    categoriesCount[d.category] = (categoriesCount[d.category] || 0) + 1;
  });

  return res.json({
    datasets: list,
    total: list.length,
    categoriesCount,
  });
});

// GET /api/datasets/search
datasetsRouter.get('/datasets/search', (req, res) => {
  const q = ((req.query.q as string) || '').toLowerCase();
  const list = Array.from(db.datasets.values()).filter(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.publisher.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      (d.topic && d.topic.toLowerCase().includes(q))
  );
  return res.json({ results: list.slice(0, 10) });
});

// GET /api/datasets/:id
datasetsRouter.get('/datasets/:id', (req, res) => {
  const dataset = db.datasets.get(req.params.id);
  if (!dataset) {
    return res.status(404).json({ error: 'Dataset not found in global catalog' });
  }

  // Related datasets in the same category
  const related = Array.from(db.datasets.values())
    .filter((d) => d.category === dataset.category && d.id !== dataset.id)
    .slice(0, 3);

  return res.json({ dataset, related });
});
