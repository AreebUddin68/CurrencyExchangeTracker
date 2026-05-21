using AuthService.Data;
using AuthService.Models;
using AuthService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthDbContext _db;
    private readonly TokenService _tokenService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AuthDbContext db, TokenService tokenService,
        ILogger<AuthController> logger)
    {
        _db = db;
        _tokenService = tokenService;
        _logger = logger;
    }

    // POST /api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        // Check if username already exists
        if (await _db.Users.AnyAsync(u => u.Username == req.Username))
            return BadRequest(new { message = "Username already exists." });

        // Check if email already exists
        if (await _db.Users.AnyAsync(u => u.Email == req.Email))
            return BadRequest(new { message = "Email already exists." });

        // Hash the password before saving - never store plain text passwords!
        var user = new User
        {
            Username = req.Username,
            Email = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = "User"
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        _logger.LogInformation("New user registered: {Username} with role {Role}",
            user.Username, user.Role);

        if (!string.Equals(req.Role, "User", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Role override attempt blocked during register for {Username}. Requested: {RequestedRole}",
                user.Username, req.Role);
        }

        return Ok(new { message = "Registered successfully.", userId = user.Id });
    }

    // POST /api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        // Find user by username
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Username == req.Username);

        // Verify password against stored hash
        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
        {
            _logger.LogWarning("Failed login attempt for username: {Username}", req.Username);
            return Unauthorized(new { message = "Invalid username or password." });
        }

        // Generate JWT token
        var token = _tokenService.GenerateToken(user);

        _logger.LogInformation("User logged in: {Username}", user.Username);

        return Ok(new
        {
            token,
            username = user.Username,
            role = user.Role,
            expiresIn = "8 hours"
        });
    }

    // GET /api/auth/users  -- Admin only
    [HttpGet("users")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _db.Users
            .Select(u => new { u.Id, u.Username, u.Email, u.Role, u.CreatedAt })
            .ToListAsync();

        return Ok(users);
    }

    // GET /api/auth/me  -- Any logged in user
    [HttpGet("me")]
    [Authorize]
    public IActionResult GetMe()
    {
        var username = User.Identity?.Name;
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        return Ok(new { username, role });
    }
}