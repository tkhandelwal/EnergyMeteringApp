// New file: EnergyMeteringApp.Server/Controllers/BaselinesController.cs
using EnergyMeteringApp.Data;
using EnergyMeteringApp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EnergyMeteringApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BaselinesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BaselinesController> _logger;

        public BaselinesController(ApplicationDbContext context, ILogger<BaselinesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Baselines
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Baseline>>> GetBaselines()
        {
            try
            {
                _logger.LogInformation("Getting all baselines");
                return await _context.Baselines
                    .Include(b => b.Classification)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting baselines");
                return StatusCode(500, new { message = "Internal server error retrieving baselines" });
            }
        }

        // GET: api/Baselines/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Baseline>> GetBaseline(int id)
        {
            try
            {
                _logger.LogInformation("Getting baseline with ID: {ID}", id);
                var baseline = await _context.Baselines
                    .Include(b => b.Classification)
                    .FirstOrDefaultAsync(b => b.Id == id);

                if (baseline == null)
                {
                    _logger.LogWarning("Baseline not found with ID: {ID}", id);
                    return NotFound();
                }

                return baseline;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting baseline with ID: {ID}", id);
                return StatusCode(500, new { message = "Internal server error retrieving baseline" });
            }
        }

        // POST: api/Baselines
        [HttpPost]
        public async Task<ActionResult<Baseline>> PostBaseline(Baseline baseline)
        {
            try
            {
                _logger.LogInformation("Creating new baseline for classification: {ClassificationId}", baseline.ClassificationId);
                _context.Baselines.Add(baseline);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetBaseline), new { id = baseline.Id }, baseline);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating baseline");
                return StatusCode(500, new { message = "Internal server error creating baseline" });
            }
        }

        // PUT: api/Baselines/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutBaseline(int id, Baseline baseline)
        {
            if (id != baseline.Id)
            {
                return BadRequest();
            }

            try
            {
                _context.Entry(baseline).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BaselineExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating baseline with ID: {ID}", id);
                return StatusCode(500, new { message = "Internal server error updating baseline" });
            }
        }

        // DELETE: api/Baselines/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBaseline(int id)
        {
            try
            {
                var baseline = await _context.Baselines.FindAsync(id);
                if (baseline == null)
                {
                    return NotFound();
                }

                _context.Baselines.Remove(baseline);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting baseline with ID: {ID}", id);
                return StatusCode(500, new { message = "Internal server error deleting baseline" });
            }
        }

        private bool BaselineExists(int id)
        {
            return _context.Baselines.Any(e => e.Id == id);
        }
    }
}