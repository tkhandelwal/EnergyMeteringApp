﻿// Models/EnPIDefinition.cs (new)
using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace EnergyMeteringApp.Models
{
    public class EnPIDefinition
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = null!;

        [Required]
        public int ClassificationId { get; set; }

        public Classification Classification { get; set; } = null!;

        [Required]
        public string FormulaType { get; set; } = null!; // TotalEnergy, EnergyPerHour, etc.

        public string NormalizeBy { get; set; } = "None";

        public string? NormalizationUnit { get; set; }

        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Target> Targets { get; set; } = new List<Target>();
    }
}