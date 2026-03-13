const githubRepo = process.env.GITHUB_REPOSITORY || 'Bodhiswan/Bodhi-Swan-Ceramics';
const githubBranch = process.env.GITHUB_BRANCH || 'main';

async function readItemsFromGithub() {
  const response = await fetch(
    `https://raw.githubusercontent.com/${githubRepo}/${githubBranch}/shop-admin/items.json`,
    {
      headers: {
        'Cache-Control': 'no-cache'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Unable to read shop items from GitHub (${response.status})`);
  }

  return response.json();
}

exports.handler = async () => {
  try {
    const items = await readItemsFromGithub();
    const statusBySlug = Object.fromEntries(
      items.map((item) => [
        item.slug,
        {
          soldOut: Boolean(item.soldOut),
          priceAud: Number(item.priceAud),
          stripeUrl: item.stripe?.paymentLinkUrl || ''
        }
      ])
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify({
        ok: true,
        source: 'github',
        items: statusBySlug,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify({
        ok: false,
        error: error.message
      })
    };
  }
};
