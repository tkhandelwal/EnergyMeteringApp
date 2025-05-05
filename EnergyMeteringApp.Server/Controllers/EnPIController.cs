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
    public class EnPIController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<EnPIController> _logger;

        public EnPIController(ApplicationDbContext context, ILogger<EnPIController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/EnPI
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EnPI>>> GetEnPIs()
        {
            try
            {
                _logger.LogInformation("Getting all EnPIs");
                return await _context.EnPIs.Include(e => e.Classification).ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting EnPIs");
                return StatusCode(500, new { message = "Internal server error retrieving EnPIs" });
            }
        }

        // GET: api/EnPI/5
        [HttpGet("{id}")]
        public async Task<ActionResult<EnPI>> GetEnPI(int id)
        {
            try
            {
                _logger.LogInformation("Getting EnPI with ID: {ID}", id);
                var enpi = await _context.EnPIs.Include(e => e.Classification).FirstOrDefaultAsync(e => e.Id == id);

                if (enpi == null)
                {
                    _logger.LogWarning("EnPI not found with ID: {ID}", id);
                    return NotFound();
                }

                return enpi;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting EnPI with ID: {ID}", id);
                return StatusCode(500, new { message = "Internal server error retrieving EnPI" });
            }
        }

        // POST: api/EnPI/calculate
        [HttpPost("calculate")]
        public async Task<ActionResult<EnPI>> CalculateEnPI(EnPICalculationRequest request)
        {
            try
            {
                _logger.LogInformation("Calculating EnPI for classification: {ClassificationId}", request.ClassificationId);

                var classification = await _context.Classifications.FindAsync(request.ClassificationId);
                if (classification == null)
                {
                    return NotFound("Classification not found");
                }

                // Get metering data for the specified date range and classification
                var meteringData = await _context.MeteringData
                    .Where(m => m.ClassificationId == request.ClassificationId
                           && m.Timestamp >= request.StartDate
                           && m.Timestamp <= request.EndDate)
                    .ToListAsync();

                if (!meteringData.Any())
                {
                    return BadRequest("No metering data found for the specified criteria");
                }

                // Calculate EnPI value based on formula
                double enpiValue = 0;
                double baselineValue = 0;

                switch (request.Formula)
                {
                    case "TotalEnergy":
                        enpiValue = meteringData.Sum(m => m.EnergyValue);
                        break;

                    case "EnergyPerHour":
                        double hours = (request.EndDate - request.StartDate).TotalHours;
                        enpiValue = meteringData.Sum(m => m.EnergyValue) / hours;
                        break;

                    case "MaxPower":
                        enpiValue = meteringData.Max(m => m.Power);
                        break;

                    case "AvgPower":
                        enpiValue = meteringData.Average(m => m.Power);
                        break;

                    default:
                        return BadRequest("Invalid formula specified");
                }

                // Get baseline data if specified
                if (request.BaselineStartDate.HasValue && request.BaselineEndDate.HasValue)
                {
                    var baselineData = await _context.MeteringData
                        .Where(m => m.ClassificationId == request.ClassificationId
                               && m.Timestamp >= request.BaselineStartDate
                               && m.Timestamp <= request.BaselineEndDate)
                        .ToListAsync();

                    if (baselineData.Any())
                    {
                        switch (request.Formula)
                        {
                            case "TotalEnergy":
                                baselineValue = baselineData.Sum(m => m.EnergyValue);
                                break;

                            case "EnergyPerHour":
                                double hours = (request.BaselineEndDate.Value - request.BaselineStartDate.Value).TotalHours;
                                baselineValue = baselineData.Sum(m => m.EnergyValue) / hours;
                                break;

                            case "MaxPower":
                                baselineValue = baselineData.Max(m => m.Power);
                                break;

                            case "AvgPower":
                                baselineValue = baselineData.Average(m => m.Power);
                                break;
                        }
                    }
                }

                // Create and save new EnPI
                var enpi = new EnPI
                {
                    Name = request.Name,
                    Formula = request.Formula,
                    CurrentValue = enpiValue,
                    BaselineValue = baselineValue,
                    CalculationDate = DateTime.UtcNow,
                    ClassificationId = request.ClassificationId
                };

                _context.EnPIs.Add(enpi);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetEnPI), new { id = enpi.Id }, enpi);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating EnPI");
                return StatusCode(500, new { message = "Internal server error calculating EnPI" });
            }
        }

        // DELETE: api/EnPI/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEnPI(int id)
        {
            try
            {
                var enpi = await _context.EnPIs.FindAsync(id);
                if (enpi == null)
                {
                    return NotFound();
                }

                _context.EnPIs.Remove(enpi);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting EnPI with ID: {ID}", id);
                return StatusCode(500, new { message = "Internal server error deleting EnPI" });
            }
        }
    }

    public class EnPICalculationRequest
    {
        public string Name { get; set; } = null!;
        public string Formula { get; set; } = null!;// TotalEnergy, EnergyPerHour, MaxPower, AvgPower
        public int ClassificationId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime? BaselineStartDate { get; set; }
        public DateTime? BaselineEndDate { get; set; }
    }
}