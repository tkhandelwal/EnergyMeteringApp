// Controllers/MeteringDataController.cs
using EnergyMeteringApp.Data;
using EnergyMeteringApp.Models;
using EnergyMeteringApp.Services;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EnergyMeteringApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MeteringDataController : ControllerBase
    {
        private readonly ILogger<MeteringDataController> _logger;
        private readonly MeteringService _meteringService;

        public MeteringDataController(
            MeteringService meteringService,
            ILogger<MeteringDataController> logger)
        {
            _meteringService = meteringService;
            _logger = logger;
        }

        // GET: api/MeteringData
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MeteringData>>> GetMeteringData(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int? classificationId = null)
        {
            try
            {
                _logger.LogInformation("Getting filtered metering data");
                var data = await _meteringService.GetMeteringDataAsync(startDate, endDate, classificationId);
                return Ok(data);
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

                var generatedData = await _meteringService.GenerateSyntheticDataAsync(request);

                _logger.LogInformation("Generated {Count} data points for classification {Id}",
                    generatedData.Count, request.ClassificationId);

                return generatedData;
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating synthetic data");
                return StatusCode(500, new { message = "Internal server error generating data" });
            }
        }
    }
}