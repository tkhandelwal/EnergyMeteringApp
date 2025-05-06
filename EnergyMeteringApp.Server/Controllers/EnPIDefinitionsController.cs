// New file: EnergyMeteringApp.Server/Controllers/EnPIDefinitionsController.cs
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
    public class EnPIDefinitionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<EnPIDefinitionsController> _logger;

        public EnPIDefinitionsController(ApplicationDbContext context, ILogger<EnPIDefinitionsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/EnPIDefinitions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EnPIDefinition>>> GetEnPIDefinitions()
        {
            try
            {
                _logger.LogInformation("Getting all EnPI definitions");
                return await _context.EnPIDefinitions.Include(e => e.Classification).ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting EnPI definitions");
                return StatusCode(500, new { message = "Internal server error retrieving EnPI definitions" });
            }
        }

        // GET: api/EnPIDefinitions/5
        [HttpGet("{id}")]
        public async Task<ActionResult<EnPIDefinition>> GetEnPIDefinition(int id)
        {
            try
            {
                _logger.LogInformation("Getting EnPI definition with ID: {ID}", id);
                var enpiDefinition = await _context.EnPIDefinitions
                    .Include(e => e.Classification)
                    .Include(e => e.Targets)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (enpiDefinition == null)
                {
                    _logger.LogWarning("EnPI definition not found with ID: {ID}", id);
                    return NotFound();
                }

                return enpiDefinition;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting EnPI definition with ID: {ID}", id);
                return StatusCode(500, new { message = "Internal server error retrieving EnPI definition" });
            }
        }

        // POST: api/EnPIDefinitions
        [HttpPost]
        public async Task<ActionResult<EnPIDefinition>> PostEnPIDefinition(EnPIDefinition enpiDefinition)
        {
            try
            {
                _logger.LogInformation("Creating new EnPI definition: {Name}", enpiDefinition.Name);
                _context.EnPIDefinitions.Add(enpiDefinition);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetEnPIDefinition), new { id = enpiDefinition.Id }, enpiDefinition);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating EnPI definition");
                return StatusCode(500, new { message = "Internal server error creating EnPI definition" });
            }
        }

        // PUT: api/EnPIDefinitions/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutEnPIDefinition(int id, EnPIDefinition enpiDefinition)
        {
            if (id != enpiDefinition.Id)
            {
                return BadRequest();
            }

            try
            {
                _context.Entry(enpiDefinition).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EnPIDefinitionExists(id))
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
                _logger.LogError(ex, "Error updating EnPI definition with ID: {ID}", id);
                return StatusCode(500, new { message = "Internal server error updating EnPI definition" });
            }
        }

        // DELETE: api/EnPIDefinitions/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEnPIDefinition(int id)
        {
            try
            {
                var enpiDefinition = await _context.EnPIDefinitions.FindAsync(id);
                if (enpiDefinition == null)
                {
                    return NotFound();
                }

                _context.EnPIDefinitions.Remove(enpiDefinition);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting EnPI definition with ID: {ID}", id);
                return StatusCode(500, new { message = "Internal server error deleting EnPI definition" });
            }
        }

        private bool EnPIDefinitionExists(int id)
        {
            return _context.EnPIDefinitions.Any(e => e.Id == id);
        }
    }
}