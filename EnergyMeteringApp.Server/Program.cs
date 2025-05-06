using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using EnergyMeteringApp.Data;
using Microsoft.Extensions.FileProviders;
using EnergyMeteringApp.Services;
using System;
using System.IO;

Console.WriteLine("Starting Energy Metering Application Server...");

var builder = WebApplication.CreateBuilder(args);

// Log the environment
Console.WriteLine($"Environment: {builder.Environment.EnvironmentName}");

if (!Directory.Exists(Path.Combine(builder.Environment.ContentRootPath, "wwwroot")))
{
    Directory.CreateDirectory(Path.Combine(builder.Environment.ContentRootPath, "wwwroot"));
}

builder.Services.Configure<StaticFileOptions>(options =>
{
    options.FileProvider = new PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "wwwroot"));
});

// Add services to the container.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = null;
    options.JsonSerializerOptions.WriteIndented = true;
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy",
        policy => {
            policy.WithOrigins(
                    "http://localhost:53992",
                    "http://localhost:5255")
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<MeteringService>();

// Print URLs that the application will be listening on
Console.WriteLine($"Application URLs: {string.Join(", ", builder.WebHost.GetSetting("urls") ?? "Default URLs")}");

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseExceptionHandler("/Error");
    // Remove HTTPS redirection
    // app.UseHsts();
}

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        Console.WriteLine("Ensuring database is created...");
        context.Database.EnsureCreated();
        Console.WriteLine("Database setup complete.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"An error occurred while setting up the database: {ex.Message}");
    }
}

// Remove HTTPS redirection
// app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseCors("CorsPolicy");

app.UseRouting();

// Map all controllers - this is essential
app.MapControllers();

Console.WriteLine("Controllers mapped. Application setup complete.");

// Use SPA proxy in development
if (app.Environment.IsDevelopment())
{
    app.UseSpa(spa =>
    {
        spa.UseProxyToSpaDevelopmentServer("http://localhost:53992");
    });
}

Console.WriteLine("Server starting...");
app.Run();
Console.WriteLine("Server stopped.");