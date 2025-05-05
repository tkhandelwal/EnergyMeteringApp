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
    public class MeteringDataController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<MeteringDataController> _logger;
        private readonly Random _random = new Random();

        public MeteringDataController(ApplicationDbContext context, ILogger<MeteringDataController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/MeteringData
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MeteringData>>> GetMeteringData()
        {
            try
            {
                _logger.LogInformation("Getting all metering data");
                return await _context.MeteringData.Include(m => m.Classification).ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting metering data");
                return StatusCode(500, new { message = "Internal server error retrieving metering data" });
            }
        }

        // POST: api/MeteringData/generate
        [HttpPost("generate")]
        public async Task<ActionResult<IEnumerable<MeteringData>>> GenerateSyntheticData([FromBody] SyntheticDataRequest request)
        {
            try
            {
                if (request.ClassificationId <= 0)
                {
                    return BadRequest("Invalid Classification ID");
                }

                var classification = await _context.Classifications.FindAsync(request.ClassificationId);
                if (classification == null)
                {
                    return NotFound("Classification not found");
                }

                var generatedData = new List<MeteringData>();
                var startDate = request.StartDate;
                var endDate = request.EndDate;

                // Basic patterns
                double baseValue = request.BaseValue;
                double variance = request.Variance;

                _logger.LogInformation("Generating synthetic data for classification: {Name}, from {Start} to {End}",
                    classification.Name, startDate, endDate);

                // Generate data for each interval
                for (DateTime date = startDate; date <= endDate; date = date.AddMinutes(request.IntervalMinutes))
                {
                    // Create patterns based on time of day and day of week
                    double timeOfDayFactor = GetTimeOfDayFactor(date);
                    double dayOfWeekFactor = GetDayOfWeekFactor(date);

                    // Add some randomness
                    double randomFactor = (_random.NextDouble() * 2 - 1) * variance;

                    // Calculate the energy value with patterns
                    double energyValue = baseValue * timeOfDayFactor * dayOfWeekFactor + randomFactor;

                    // Ensure non-negative values
                    energyValue = Math.Max(0, energyValue);

                    // Calculate power (kW) based on energy consumption over interval
                    double power = energyValue * 60 / request.IntervalMinutes;

                    var meteringData = new MeteringData
                    {
                        Timestamp = date,
                        EnergyValue = energyValue,
                        Power = power,
                        ClassificationId = request.ClassificationId,
                    };

                    generatedData.Add(meteringData);
                }

                _context.MeteringData.AddRange(generatedData);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Generated {Count} data points for classification {Name}",
                    generatedData.Count, classification.Name);

                return generatedData;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating synthetic data");
                return StatusCode(500, new { message = "Internal server error generating data" });
            }
        }

        // Helper methods for synthetic data generation
        private double GetTimeOfDayFactor(DateTime date)
        {
            int hour = date.Hour;

            // Simulate higher usage during working hours
            if (hour >= 8 && hour <= 17)
            {
                return 1.0 + 0.5 * Math.Sin((hour - 8) * Math.PI / 9); // Peak at mid-day
            }
            else if (hour >= 18 && hour <= 22)
            {
                return 0.7; // Evening
            }
            else
            {
                return 0.3; // Night
            }
        }

        private double GetDayOfWeekFactor(DateTime date)
        {
            // Weekends have lower usage
            if (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday)
            {
                return 0.6;
            }
            return 1.0;
        }
    }

    public class SyntheticDataRequest
    {
        public int ClassificationId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int IntervalMinutes { get; set; } = 15; // Default 15-minute intervals
        public double BaseValue { get; set; } = 10.0; // Base energy consumption in kWh
        public double Variance { get; set; } = 2.0; // Random variance amount
    }
}