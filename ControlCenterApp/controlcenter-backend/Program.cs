var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers(); 
builder.Services.AddOpenApi();

builder.Services.AddCors(options => {
    options.AddPolicy("AllowAngular", policy => 
            policy
                .WithOrigins(
                    "http://localhost:4200",    
                    "http://localhost:4201",
                    "http://192.168.6.10:4200", // CC-Frontend auf VM
                    "http://192.168.6.10:4201", // Client-Frontend auf VM
                    "http://192.168.6.10:3000", // Signaling Server
                    "http://192.168.6.10:3001"
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
    );
    
    options.AddPolicy("AllowAll", policy =>
            policy
                .AllowAnyOrigin() 
                .AllowAnyHeader()
                .AllowAnyMethod()
    );
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseCors("AllowAll");
}
else
{
    
    app.UseCors("AllowAngular");
}

app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers(); 

app.Run();