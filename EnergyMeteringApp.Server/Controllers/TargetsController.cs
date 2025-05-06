// New file: EnergyMeteringApp.Server/Controllers/TargetsController.cs
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
    public class TargetsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TargetsController> _logger;

        public TargetsController(ApplicationDbContext context, ILogger<TargetsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Targets
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Target>>> GetTargets()
        {
            try
            {
                _logger.LogInformation("Getting all targets");
                return await _context.Targets
                    .Include(t => t.EnPIDefinition)
                    .ThenInclude(e => e.Classification)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting targets");
                return StatusCode(500, new { message = "Internal server error retrieving targets" });
            }
        }

        // GET: api/Targets/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Target>> GetTarget(int id)
        {
            try
            {
                _logger.LogInformation("Getting target with ID: {ID}", id);
                var target = await _context.Targets
                    .Include(t => t.EnPIDefinition)
                    .ThenInclude(e => e.Classification)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (target == null)
                {
                    _logger.LogWarning("Target not found with ID: {ID}", id);
                    return NotFound();
                }

                return target;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting target with ID: {ID}", id);
                return StatusCode(500, new { message = "Internal server error retrieving target" });
            }
        }

        // POST: api/Targets
        [HttpPost]
        public async Task<ActionResult<Target>> PostTarget(Target target)
        {
            try
            {
                _logger.LogInformation("Creating new target for EnPI definition: {EnPIDefinitionId}", target.EnPIDefinitionId);
                _context.Targets.Add(target);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetTarget), new { id = target.Id }, target);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating target");
                return StatusCode(500, new { message = "Internal server error creating target" });
            }
        }

        // PUT: api/Targets/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTarget(int id, Target target)
        {
            if (id != target.Id)
            {
                return BadRequest();
            }

            try
            {
                _context.Entry(target).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TargetExists(id))
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
                _logger.LogError(ex, "Error updating target with ID: {ID}", id);
                return StatusCode(500, new { message = "Internal server error updating target" });
            }
        }

        // DELETE: api/Targets/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTarget(int id)
        {
            try
            {
                var target = await _context.Targets.FindAsync(id);
                if (target == null)
                {
                    return NotFound();
                }

                _context.Targets.Remove(target);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting target with ID: {ID}", id);
                return StatusCode(500, new { message = "Internal server error deleting target" });
            }
        }

        private bool TargetExists(int id)
        {
            return _context.Targets.Any(e => e.Id == id);
        }
    }
}