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
    public class ClassificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ClassificationsController> _logger;

        public ClassificationsController(ApplicationDbContext context, ILogger<ClassificationsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Classifications
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Classification>>> GetClassifications()
        {
            try
            {
                _logger.LogInformation("Getting all classifications");
                return await _context.Classifications.ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting classifications");
                return StatusCode(500, new { message = "Internal server error retrieving classifications" });
            }
        }

        // GET: api/Classifications/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Classification>> GetClassification(int id)
        {
            try
            {
                _logger.LogInformation("Getting classification with ID: {ID}", id);
                var classification = await _context.Classifications.FindAsync(id);

                if (classification == null)
                {
                    _logger.LogWarning("Classification not found with ID: {ID}", id);
                    return NotFound();
                }

                return classification;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting classification with ID: {ID}", id);
                return StatusCode(500, new { message = "Internal server error retrieving classification" });
            }
        }

        // POST: api/Classifications
        [HttpPost]
        public async Task<ActionResult<Classification>> PostClassification(Classification classification)
        {
            try
            {
                _logger.LogInformation("Creating new classification: {Name}", classification.Name);
                _context.Classifications.Add(classification);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetClassification), new { id = classification.Id }, classification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating classification");
                return StatusCode(500, new { message = "Internal server error creating classification" });
            }
        }

        // PUT: api/Classifications/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutClassification(int id, Classification classification)
        {
            if (id != classification.Id)
            {
                return BadRequest();
            }

            try
            {
                _context.Entry(classification).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ClassificationExists(id))
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
                _logger.LogError(ex, "Error updating classification with ID: {ID}", id);
                return StatusCode(500, new { message = "Internal server error updating classification" });
            }
        }

        // DELETE: api/Classifications/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClassification(int id)
        {
            try
            {
                var classification = await _context.Classifications.FindAsync(id);
                if (classification == null)
                {
                    return NotFound();
                }

                _context.Classifications.Remove(classification);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting classification with ID: {ID}", id);
                return StatusCode(500, new { message = "Internal server error deleting classification" });
            }
        }

        private bool ClassificationExists(int id)
        {
            return _context.Classifications.Any(e => e.Id == id);
        }
    }
}